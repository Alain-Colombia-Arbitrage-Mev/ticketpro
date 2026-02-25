/**
 * Supabase Edge Function: Get Tickets by Order ID
 * 
 * Retorna los tickets asociados a un orderId (purchase_id).
 * Usado por el frontend para verificar tickets después de un pago con criptomonedas.
 * 
 * Environment variables necesarias (configurar en Supabase Dashboard):
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { CORS_HEADERS, corsResponse } from "../_shared/cors.ts";
import { verifyAuth } from "../_shared/auth.ts";

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return corsResponse();
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }

  try {
    // Obtener configuración
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Server not configured: missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY",
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    // Verify authentication
    const authResult = await verifyAuth(req, supabaseUrl, supabaseServiceKey);
    if (authResult.error || !authResult.user) {
      return new Response(
        JSON.stringify({ ok: false, error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    // Obtener orderId de la URL
    // La URL será: /functions/v1/orders-tickets/{orderId}
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(p => p);
    // Buscar el orderId después de "orders-tickets"
    const ordersIndex = pathParts.indexOf("orders-tickets");
    const orderId = ordersIndex >= 0 && pathParts[ordersIndex + 1] 
      ? pathParts[ordersIndex + 1] 
      : url.searchParams.get("orderId") || "";

    if (!orderId) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Missing orderId",
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    // Inicializar Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Seleccionar solo campos no sensibles
    const { data: tickets, error } = await supabase
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
        updated_at
      `)
      .eq("purchase_id", orderId);

    if (error) {
      console.error("Error fetching tickets:", error);
      return new Response(
        JSON.stringify({
          ok: false,
          orderId,
          error: "Failed to fetch tickets from Supabase",
          details: error.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    // Authorization: verify user owns these tickets or is admin/hoster
    if (tickets && tickets.length > 0) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", authResult.user.id)
        .single();

      const userRole = profile?.role || "user";
      const isPrivileged = ["admin", "hoster"].includes(userRole);

      // Check if user is the buyer of at least one of these tickets
      const isOwner = tickets.some((t: any) =>
        t.buyer_email?.toLowerCase() === authResult.user!.email?.toLowerCase()
      );

      // Note: We check buyer_email from tickets since buyer info may not be in a separate orders table query
      if (!isOwner && !isPrivileged) {
        return new Response(
          JSON.stringify({ ok: false, error: "Access denied" }),
          { status: 403, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        orderId,
        count: Array.isArray(tickets) ? tickets.length : 0,
        tickets: Array.isArray(tickets) ? tickets : [],
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


