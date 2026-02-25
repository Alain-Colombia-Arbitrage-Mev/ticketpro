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
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { CORS_HEADERS, corsResponse } from "../_shared/cors.ts";

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
    return corsResponse();
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

    // Server-side price validation - query actual prices from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error: missing Supabase credentials" }),
        { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate each item's price against the database
    for (const item of items) {
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("base_price")
        .eq("id", item.eventId)
        .single();

      if (eventError || !event) {
        return new Response(
          JSON.stringify({ error: `Event not found: ${item.eventId}` }),
          { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
        );
      }

      // Calculate expected price (10% discount for 2+ tickets)
      const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
      const expectedPrice = totalQuantity >= 2
        ? Number((event.base_price * 0.9).toFixed(2))
        : event.base_price;

      if (Math.abs(item.price - expectedPrice) > 0.01) {
        console.error(`Price mismatch for event ${item.eventId}: sent ${item.price}, expected ${expectedPrice}`);
        return new Response(
          JSON.stringify({ error: "Price validation failed. Please refresh and try again." }),
          { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
        );
      }
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
    const randomBytes = new Uint8Array(8);
    crypto.getRandomValues(randomBytes);
    const randomStr = Array.from(randomBytes, b => b.toString(36).padStart(2, "0")).join("").substring(0, 9);
    const orderId = `order_${Date.now()}_${randomStr}`;

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
