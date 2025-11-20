/**
 * Supabase Edge Function: Validate Ticket
 * 
 * Valida un ticket y opcionalmente lo marca como usado.
 * Funciona para tickets de cualquier método de pago (Stripe, Cryptomus, etc.)
 * 
 * Environment variables necesarias (configurar en Supabase Dashboard):
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "GET" && req.method !== "POST") {
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

    // Obtener parámetros
    const url = new URL(req.url);
    const ticketId = url.searchParams.get("ticketId") || url.searchParams.get("ticket_id");
    const ticketCode = url.searchParams.get("code") || url.searchParams.get("ticket_code");
    const markAsUsed = url.searchParams.get("markAsUsed") === "true" || 
                       (req.method === "POST" && url.searchParams.get("action") === "validate");

    if (!ticketId && !ticketCode) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Missing ticketId or code parameter",
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    // Inicializar Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar ticket
    let query = supabase.from("tickets").select("*");
    
    if (ticketId) {
      query = query.eq("id", ticketId);
    } else if (ticketCode) {
      query = query.eq("ticket_code", ticketCode);
    }

    const { data: tickets, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching ticket:", fetchError);
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Error fetching ticket",
          details: fetchError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    if (!tickets || tickets.length === 0) {
      return new Response(
        JSON.stringify({
          ok: false,
          valid: false,
          message: "Ticket no encontrado",
        }),
        { status: 404, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    const ticket = tickets[0];

    // Validar estado
    if (ticket.status === "issued_used") {
      return new Response(
        JSON.stringify({
          ok: true,
          valid: false,
          ticket: {
            id: ticket.id,
            ticket_code: ticket.ticket_code,
            status: ticket.status,
            event_name: ticket.event_name,
            event_date: ticket.event_date,
            used_at: ticket.used_at,
            used_by: ticket.used_by,
          },
          message: "Este ticket ya ha sido usado",
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    if (ticket.status === "cancelled") {
      return new Response(
        JSON.stringify({
          ok: true,
          valid: false,
          ticket: {
            id: ticket.id,
            ticket_code: ticket.ticket_code,
            status: ticket.status,
            event_name: ticket.event_name,
          },
          message: "Este ticket ha sido cancelado",
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    if (ticket.status === "refunded") {
      return new Response(
        JSON.stringify({
          ok: true,
          valid: false,
          ticket: {
            id: ticket.id,
            ticket_code: ticket.ticket_code,
            status: ticket.status,
            event_name: ticket.event_name,
          },
          message: "Este ticket ha sido reembolsado",
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    // Validar fecha del evento
    const eventDate = new Date(ticket.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      return new Response(
        JSON.stringify({
          ok: true,
          valid: false,
          ticket: {
            id: ticket.id,
            ticket_code: ticket.ticket_code,
            status: ticket.status,
            event_name: ticket.event_name,
            event_date: ticket.event_date,
          },
          message: "Este ticket no puede ser usado porque la fecha del evento ya pasó",
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    // Si se solicita marcar como usado
    if (markAsUsed && ticket.status === "issued_unused") {
      const nowIso = new Date().toISOString();
      const { data: updatedTicket, error: updateError } = await supabase
        .from("tickets")
        .update({
          status: "issued_used",
          used_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", ticket.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating ticket:", updateError);
        return new Response(
          JSON.stringify({
            ok: true,
            valid: true,
            ticket: {
              id: ticket.id,
              ticket_code: ticket.ticket_code,
              status: ticket.status,
              event_name: ticket.event_name,
              event_date: ticket.event_date,
            },
            message: "Ticket válido (pero no se pudo marcar como usado)",
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
        );
      }

      return new Response(
        JSON.stringify({
          ok: true,
          valid: true,
          markedAsUsed: true,
          ticket: {
            id: updatedTicket.id,
            ticket_code: updatedTicket.ticket_code,
            status: updatedTicket.status,
            event_name: updatedTicket.event_name,
            event_date: updatedTicket.event_date,
            used_at: updatedTicket.used_at,
          },
          message: "Ticket válido y marcado como usado",
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    // Ticket válido pero no marcado como usado
    return new Response(
      JSON.stringify({
        ok: true,
        valid: true,
        ticket: {
          id: ticket.id,
          ticket_code: ticket.ticket_code,
          status: ticket.status,
          event_name: ticket.event_name,
          event_date: ticket.event_date,
          event_time: ticket.event_time,
          event_location: ticket.event_location,
          ticket_type: ticket.ticket_type,
          seat_number: ticket.seat_number,
          seat_type: ticket.seat_type,
          gate_number: ticket.gate_number,
          ticket_class: ticket.ticket_class,
          price: ticket.price,
          price_paid: ticket.price_paid,
          payment_method_id: ticket.payment_method_id,
        },
        message: "Ticket válido",
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



