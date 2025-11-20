/**
 * Supabase Edge Function: Create Stripe Checkout Session
 * 
 * Este endpoint crea una sesión de checkout de Stripe para procesar pagos de tickets.
 * 
 * Environment variables necesarias (configurar en Supabase Dashboard):
 *   - STRIPE_SECRET_KEY_TEST  (para desarrollo)
 *   - STRIPE_SECRET_KEY_PROD  (para producción)
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY (para crear tickets después del pago)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface CheckoutRequest {
  items: Array<{
    eventId: string;
    eventName: string;
    eventDate: string;
    eventTime?: string;
    eventLocation?: string;
    eventCategory?: string;
    ticketType?: string;
    seatType?: string;
    price: number;
    quantity: number;
  }>;
  buyerEmail: string;
  buyerFullName?: string;
  buyerAddress?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

serve(async (req: Request) => {
  // Manejar CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }

  try {
    // Obtener la clave secreta según el entorno
    // IMPORTANTE: Las claves secretas NO deben tener prefijo VITE_
    // Configurar en Supabase Dashboard > Functions > Secrets
    const isProd = Deno.env.get("ENVIRONMENT") === "production";
    const stripeSecretKey = 
      Deno.env.get(isProd ? "STRIPE_SECRET_KEY_PROD" : "STRIPE_SECRET_KEY_TEST") ||
      Deno.env.get("stripe_private_key") ||
      Deno.env.get("STRIPE_PRIVATE_KEY");

    if (!stripeSecretKey) {
      console.error("Missing Stripe secret key");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    // Inicializar Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-11-20.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Parse request body
    const body: CheckoutRequest = await req.json();
    const { items, buyerEmail, buyerFullName, successUrl, cancelUrl, metadata } = body;

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "No items provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    if (!buyerEmail) {
      return new Response(
        JSON.stringify({ error: "Buyer email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    // Crear line items para Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(item => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: `${item.eventName} - ${item.ticketType || "Ticket"}`,
          description: `${item.eventDate}${item.eventTime ? ` at ${item.eventTime}` : ""}${
            item.eventLocation ? ` - ${item.eventLocation}` : ""
          }`,
          metadata: {
            eventId: item.eventId,
            eventName: item.eventName,
            ticketType: item.ticketType || "General",
          },
        },
        unit_amount: Math.round(item.price * 100), // Convertir a centavos
      },
      quantity: item.quantity,
    }));

    // Generar order ID único
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Metadata completa para el webhook
    const sessionMetadata: Record<string, string> = {
      orderId,
      buyerEmail,
      buyerFullName: buyerFullName || "",
      items: JSON.stringify(items), // Guardar items para el webhook
      ...metadata,
    };

    // Crear Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: buyerEmail,
      metadata: sessionMetadata,
      expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutos
    });

    console.log(`Checkout session created: ${session.id} for order ${orderId}`);

    return new Response(
      JSON.stringify({
        ok: true,
        sessionId: session.id,
        url: session.url,
        orderId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      }
    );
  }
});
