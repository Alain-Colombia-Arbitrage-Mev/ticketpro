import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper to generate unique IDs
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to generate QR code data
function generateQRCode(ticketId: string, eventId: string, userId: string): string {
  const data = {
    ticketId,
    eventId,
    userId,
    timestamp: Date.now(),
  };
  return btoa(JSON.stringify(data));
}

// Helper to verify user authentication
async function verifyUser(authHeader: string | undefined) {
  if (!authHeader) {
    return null;
  }

  const accessToken = authHeader.split(' ')[1];
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    return null;
  }

  return user;
}

// Health check endpoint
app.get("/make-server-97d4f7c5/health", (c) => {
  return c.json({ status: "ok" });
});

// ===== AUTHENTICATION ROUTES =====

// Send Magic Link
app.post("/make-server-97d4f7c5/auth/magic-link", async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Send magic link OTP
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // The user will be redirected to this URL after clicking the magic link
        emailRedirectTo: `https://${Deno.env.get('SUPABASE_URL')?.replace('https://', '')}`,
      }
    });

    if (error) {
      console.error('Magic link error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ 
      message: "Magic link sent successfully! Check your email.",
      email 
    });
  } catch (error) {
    console.error('Magic link error:', error);
    return c.json({ error: "Internal server error sending magic link" }, 500);
  }
});

// Forgot Password - Send Reset Link
app.post("/make-server-97d4f7c5/auth/forgot-password", async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Send password reset email
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://${Deno.env.get('SUPABASE_URL')?.replace('https://', '')}`,
    });

    if (error) {
      console.error('Forgot password error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ 
      message: "Password reset link sent successfully! Check your email.",
      email 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json({ error: "Internal server error sending reset link" }, 500);
  }
});

// Sign up
app.post("/make-server-97d4f7c5/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Create user profile with initial balance (multi-currency)
    const userId = data.user.id;
    const userProfile = {
      id: userId,
      email,
      name,
      balance: {
        USD: 0,
        MXN: 0,
        BRL: 0,
        EUR: 0,
      },
      preferredCurrency: 'USD', // Default currency
      createdAt: new Date().toISOString(),
    };

    await kv.set(`user:${userId}`, userProfile);

    return c.json({ user: userProfile, message: "User created successfully" });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: "Internal server error during signup" }, 500);
  }
});

// ===== USER ROUTES =====

// Get user profile
app.get("/make-server-97d4f7c5/user/profile", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile) {
      return c.json({ error: "User profile not found" }, 404);
    }

    return c.json({ user: userProfile });
  } catch (error) {
    console.error('Get profile error:', error);
    return c.json({ error: "Internal server error while fetching profile" }, 500);
  }
});

// Add balance (recarga) - Multi-currency support
app.post("/make-server-97d4f7c5/user/add-balance", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { amount, currency = 'USD' } = await c.req.json();

    if (!amount || amount <= 0) {
      return c.json({ error: "Invalid amount" }, 400);
    }

    if (!['USD', 'MXN', 'BRL', 'EUR'].includes(currency)) {
      return c.json({ error: "Invalid currency. Must be USD, MXN, BRL, or EUR" }, 400);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile) {
      return c.json({ error: "User profile not found" }, 404);
    }

    // Initialize balance object if it's old format (single number)
    if (typeof userProfile.balance === 'number') {
      userProfile.balance = {
        USD: 0,
        MXN: userProfile.balance, // Migrate old MXN balance
        BRL: 0,
        EUR: 0,
      };
    }

    // Update balance for specific currency
    userProfile.balance[currency] = (userProfile.balance[currency] || 0) + amount;
    await kv.set(`user:${user.id}`, userProfile);

    // Create transaction record
    const transactionId = generateId('txn');
    const transaction = {
      id: transactionId,
      userId: user.id,
      type: 'deposit',
      amount,
      currency,
      date: new Date().toISOString(),
      description: `Recarga de saldo (${currency})`,
    };
    await kv.set(`transaction:${transactionId}`, transaction);

    return c.json({ balance: userProfile.balance, transaction });
  } catch (error) {
    console.error('Add balance error:', error);
    return c.json({ error: "Internal server error while adding balance" }, 500);
  }
});

// Update preferred currency
app.post("/make-server-97d4f7c5/user/currency", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { currency } = await c.req.json();

    if (!['USD', 'MXN', 'BRL', 'EUR'].includes(currency)) {
      return c.json({ error: "Invalid currency. Must be USD, MXN, BRL, or EUR" }, 400);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile) {
      return c.json({ error: "User profile not found" }, 404);
    }

    userProfile.preferredCurrency = currency;
    await kv.set(`user:${user.id}`, userProfile);

    return c.json({ message: "Currency updated successfully", preferredCurrency: currency });
  } catch (error) {
    console.error('Update currency error:', error);
    return c.json({ error: "Internal server error while updating currency" }, 500);
  }
});

// Get user transactions
app.get("/make-server-97d4f7c5/user/transactions", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const allTransactions = await kv.getByPrefix(`transaction:`);
    const userTransactions = allTransactions
      .filter((txn: any) => txn.userId === user.id)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return c.json({ transactions: userTransactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    return c.json({ error: "Internal server error while fetching transactions" }, 500);
  }
});

// ===== TICKET ROUTES =====

// Purchase ticket - Multi-currency support
app.post("/make-server-97d4f7c5/tickets/purchase", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { eventId, eventTitle, eventDate, eventLocation, eventImage, price, quantity, currency = 'USD' } = await c.req.json();

    if (!eventId || !eventTitle || !price || !quantity || quantity <= 0) {
      return c.json({ error: "Invalid purchase data" }, 400);
    }

    if (!['USD', 'MXN', 'BRL', 'EUR'].includes(currency)) {
      return c.json({ error: "Invalid currency" }, 400);
    }

    const totalPrice = price * quantity;

    // Get user profile
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile) {
      return c.json({ error: "User profile not found" }, 404);
    }

    // Initialize balance object if it's old format
    if (typeof userProfile.balance === 'number') {
      userProfile.balance = {
        USD: 0,
        MXN: userProfile.balance,
        BRL: 0,
        EUR: 0,
      };
    }

    // Check balance in specific currency
    const currentBalance = userProfile.balance[currency] || 0;
    if (currentBalance < totalPrice) {
      return c.json({ 
        error: "Insufficient balance",
        required: totalPrice,
        available: currentBalance,
        currency
      }, 400);
    }

    // Create tickets
    const tickets = [];
    for (let i = 0; i < quantity; i++) {
      const ticketId = generateId('ticket');
      const qrCode = generateQRCode(ticketId, eventId, user.id);
      
      const ticket = {
        id: ticketId,
        userId: user.id,
        eventId,
        eventTitle,
        eventDate,
        eventLocation,
        eventImage,
        qrCode,
        purchaseDate: new Date().toISOString(),
        status: 'active',
        price: price,
        currency: currency,
        seatNumber: `${String.fromCharCode(65 + Math.floor(Math.random() * 10))}${Math.floor(Math.random() * 100) + 1}`,
      };

      await kv.set(`ticket:${ticketId}`, ticket);
      tickets.push(ticket);
    }

    // Deduct balance from specific currency
    userProfile.balance[currency] -= totalPrice;
    await kv.set(`user:${user.id}`, userProfile);

    // Create transaction record
    const transactionId = generateId('txn');
    const transaction = {
      id: transactionId,
      userId: user.id,
      type: 'purchase',
      amount: -totalPrice,
      currency: currency,
      date: new Date().toISOString(),
      description: `Compra de ${quantity} ticket(s) para ${eventTitle}`,
    };
    await kv.set(`transaction:${transactionId}`, transaction);

    return c.json({ 
      tickets, 
      balance: userProfile.balance,
      transaction,
      message: `Successfully purchased ${quantity} ticket(s)` 
    });
  } catch (error) {
    console.error('Purchase ticket error:', error);
    return c.json({ error: "Internal server error during ticket purchase" }, 500);
  }
});

// Get user tickets
app.get("/make-server-97d4f7c5/tickets/my-tickets", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const allTickets = await kv.getByPrefix(`ticket:`);
    const userTickets = allTickets
      .filter((ticket: any) => ticket.userId === user.id)
      .sort((a: any, b: any) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

    return c.json({ tickets: userTickets });
  } catch (error) {
    console.error('Get tickets error:', error);
    return c.json({ error: "Internal server error while fetching tickets" }, 500);
  }
});

// Transfer ticket
app.post("/make-server-97d4f7c5/tickets/transfer", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { ticketId, recipientEmail } = await c.req.json();

    if (!ticketId || !recipientEmail) {
      return c.json({ error: "Ticket ID and recipient email are required" }, 400);
    }

    // Get ticket
    const ticket = await kv.get(`ticket:${ticketId}`);
    if (!ticket) {
      return c.json({ error: "Ticket not found" }, 404);
    }

    // Verify ownership
    if (ticket.userId !== user.id) {
      return c.json({ error: "You don't own this ticket" }, 403);
    }

    // Check ticket status
    if (ticket.status !== 'active') {
      return c.json({ error: "This ticket cannot be transferred" }, 400);
    }

    // Find recipient by email
    const allUsers = await kv.getByPrefix(`user:`);
    const recipient = allUsers.find((u: any) => u.email === recipientEmail);

    if (!recipient) {
      return c.json({ error: "Recipient not found" }, 404);
    }

    if (recipient.id === user.id) {
      return c.json({ error: "Cannot transfer to yourself" }, 400);
    }

    // Transfer ticket
    ticket.userId = recipient.id;
    ticket.transferredFrom = user.id;
    ticket.transferDate = new Date().toISOString();
    await kv.set(`ticket:${ticketId}`, ticket);

    // Create transaction records
    const transactionId = generateId('txn');
    const transaction = {
      id: transactionId,
      userId: user.id,
      type: 'transfer_out',
      amount: 0,
      date: new Date().toISOString(),
      description: `Transferencia de ticket ${ticket.eventTitle} a ${recipientEmail}`,
    };
    await kv.set(`transaction:${transactionId}`, transaction);

    const recipientTxnId = generateId('txn');
    const recipientTransaction = {
      id: recipientTxnId,
      userId: recipient.id,
      type: 'transfer_in',
      amount: 0,
      date: new Date().toISOString(),
      description: `Recibido ticket ${ticket.eventTitle} de ${user.email}`,
    };
    await kv.set(`transaction:${recipientTxnId}`, recipientTransaction);

    return c.json({ 
      message: "Ticket transferred successfully",
      ticket 
    });
  } catch (error) {
    console.error('Transfer ticket error:', error);
    return c.json({ error: "Internal server error during ticket transfer" }, 500);
  }
});

// Request email verification for ticket download
app.post("/make-server-97d4f7c5/tickets/request-download", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { ticketId } = await c.req.json();

    if (!ticketId) {
      return c.json({ error: "Ticket ID is required" }, 400);
    }

    // Get ticket
    const ticket = await kv.get(`ticket:${ticketId}`);
    if (!ticket) {
      return c.json({ error: "Ticket not found" }, 404);
    }

    // Verify ownership
    if (ticket.userId !== user.id) {
      return c.json({ error: "You don't own this ticket" }, 403);
    }

    // Generate verification token
    const verificationToken = generateId('verify');
    const verification = {
      ticketId,
      email: user.email,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      createdAt: new Date().toISOString(),
    };

    await kv.set(`emailVerification:${verificationToken}`, verification);

    // In a real app, you would send an email here
    // For now, we'll return the token directly
    return c.json({ 
      message: "Verification email sent (simulated)",
      verificationToken, // In production, this would be sent via email
      expiresIn: "15 minutes"
    });
  } catch (error) {
    console.error('Request download error:', error);
    return c.json({ error: "Internal server error while requesting download" }, 500);
  }
});

// Verify email and get ticket for download
app.get("/make-server-97d4f7c5/tickets/verify-download/:token", async (c) => {
  try {
    const token = c.req.param('token');

    const verification = await kv.get(`emailVerification:${token}`);
    if (!verification) {
      return c.json({ error: "Invalid or expired verification token" }, 404);
    }

    // Check expiration
    if (new Date(verification.expiresAt) < new Date()) {
      await kv.del(`emailVerification:${token}`);
      return c.json({ error: "Verification token expired" }, 400);
    }

    // Get ticket
    const ticket = await kv.get(`ticket:${verification.ticketId}`);
    if (!ticket) {
      return c.json({ error: "Ticket not found" }, 404);
    }

    // Delete verification token (one-time use)
    await kv.del(`emailVerification:${token}`);

    return c.json({ 
      ticket,
      message: "Ticket verified successfully"
    });
  } catch (error) {
    console.error('Verify download error:', error);
    return c.json({ error: "Internal server error during verification" }, 500);
  }
});

// Validate ticket QR code (for event entry)
app.post("/make-server-97d4f7c5/tickets/validate", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { qrCode } = await c.req.json();

    if (!qrCode) {
      return c.json({ error: "QR code is required" }, 400);
    }

    // Decode QR code
    let qrData;
    try {
      qrData = JSON.parse(atob(qrCode));
    } catch {
      return c.json({ error: "Invalid QR code format" }, 400);
    }

    // Get ticket
    const ticket = await kv.get(`ticket:${qrData.ticketId}`);
    if (!ticket) {
      return c.json({ error: "Ticket not found" }, 404);
    }

    // Check if already used
    if (ticket.status === 'used') {
      return c.json({ 
        error: "Ticket already used",
        usedAt: ticket.usedAt 
      }, 400);
    }

    // Mark as used
    ticket.status = 'used';
    ticket.usedAt = new Date().toISOString();
    await kv.set(`ticket:${qrData.ticketId}`, ticket);

    return c.json({ 
      message: "Ticket validated successfully",
      ticket 
    });
  } catch (error) {
    console.error('Validate ticket error:', error);
    return c.json({ error: "Internal server error during validation" }, 500);
  }
});

Deno.serve(app.fetch);