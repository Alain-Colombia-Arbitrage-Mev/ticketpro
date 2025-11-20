/**
 * Supabase Edge Function: Verify Stripe Checkout Session
 * 
 * Verifica el estado de una sesión de checkout de Stripe y retorna los tickets asociados.
 * Usado por el frontend para verificar si un pago fue exitoso y los tickets fueron creados.
 * 
 * Environment variables necesarias (configurar en Supabase Dashboard):
 *   - STRIPE_SECRET_KEY_TEST / STRIPE_SECRET_KEY_PROD
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }

  try {
    // Obtener configuración
    const isProd = Deno.env.get("ENVIRONMENT") === "production";
    const stripeSecretKey = 
      Deno.env.get(isProd ? "STRIPE_SECRET_KEY_PROD" : "STRIPE_SECRET_KEY_TEST") ||
      Deno.env.get("stripe_private_key") ||
      Deno.env.get("STRIPE_PRIVATE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ ok: false, error: "Server configuration error: missing Stripe secret key" }),
        { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ ok: false, error: "Server configuration error: missing Supabase credentials" }),
        { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    // Obtener sessionId de la URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(p => p);
    const verifyIndex = pathParts.indexOf("stripe-verify-session");
    const sessionId = verifyIndex >= 0 && pathParts[verifyIndex + 1] 
      ? pathParts[verifyIndex + 1] 
      : url.searchParams.get("session_id") || "";

    if (!sessionId) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing session_id parameter" }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    // Inicializar Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-11-20.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Obtener información de la sesión de Stripe
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent', 'customer'],
      });
    } catch (error) {
      console.error("Error retrieving Stripe session:", error);
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid session_id or session not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    // Extraer información de la sesión
    const orderId = session.metadata?.orderId;
    const paymentStatus = session.payment_status;
    const paymentIntent = session.payment_intent;

    // Inicializar Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar tickets asociados al orderId
    let tickets: any[] = [];
    if (orderId) {
      const { data: ticketsData, error: ticketsError } = await supabase
        .from("tickets")
        .select(`
          id,
          ticket_code,
          qr_code,
          status,
          event_id,
          event_name,
          event_date,
          event_time,
          event_location,
          event_category,
          ticket_type,
          seat_number,
          seat_type,
          gate_number,
          ticket_class,
          ticket_category_id,
          price,
          price_paid,
          payment_method_id,
          purchase_id,
          purchase_date,
          used_at,
          used_by,
          created_at,
          updated_at,
          pin
        `)
        .eq("purchase_id", orderId);

      if (!ticketsError && ticketsData) {
        tickets = ticketsData;
      }
    }

    // Determinar estado
    const isPaid = paymentStatus === "paid";
    const hasTickets = tickets.length > 0;
    const isComplete = isPaid && hasTickets;

    return new Response(
      JSON.stringify({
        ok: true,
        session: {
          id: session.id,
          payment_status: paymentStatus,
          payment_intent: typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id,
          customer_email: session.customer_email,
          amount_total: session.amount_total,
          currency: session.currency,
        },
        orderId,
        isPaid,
        hasTickets,
        isComplete,
        ticketsCount: tickets.length,
        tickets: tickets,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Unexpected server error",
        message: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }
});

