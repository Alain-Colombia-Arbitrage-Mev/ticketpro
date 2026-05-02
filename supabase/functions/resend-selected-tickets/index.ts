/**
 * Supabase Edge Function: Resend Selected Tickets
 *
 * Admin-only endpoint. Sends one email per buyer with only the selected tickets
 * that belong to that buyer.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { verifyRole } from "../_shared/auth.ts";

const MAX_TICKETS = 100;

interface ResendBody {
  ticket_ids?: string[];
}

interface TicketRow {
  id: string;
  ticket_code: string;
  qr_code: string | null;
  event_name: string | null;
  event_date: string | null;
  event_time: string | null;
  event_location: string | null;
  ticket_class: string | null;
  seat_number: string | null;
  price: number | null;
  pin: string | null;
  buyer_email: string | null;
  buyer_full_name: string | null;
  purchase_id: string | null;
  order_uuid: string | null;
}

function json(req: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(req) },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateQRCodeUrl(data: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(data)}&format=png&margin=15&ecc=H`;
}

function ticketQrData(ticket: TicketRow): string {
  const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://veltlix.com";
  return ticket.qr_code || `${frontendUrl}/validate-ticket?ticketId=${ticket.id}&code=${ticket.ticket_code}`;
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function buildTicketsHtml(tickets: TicketRow[]): string {
  return tickets.map((ticket, index) => {
    const qrCodeUrl = generateQRCodeUrl(ticketQrData(ticket));
    const eventName = escapeHtml(ticket.event_name || "Evento");
    const eventLocation = ticket.event_location ? escapeHtml(ticket.event_location) : "";
    const ticketClass = ticket.ticket_class ? escapeHtml(ticket.ticket_class) : "";
    const seatNumber = ticket.seat_number ? escapeHtml(ticket.seat_number) : "";
    const pin = ticket.pin ? escapeHtml(ticket.pin) : "";

    return `
      <div style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); padding: 25px; border-radius: 16px; margin: 25px 0; border: 3px solid #e9ecef; box-shadow: 0 6px 12px rgba(0,0,0,0.12);">
        <div style="display: flex; align-items: flex-start; gap: 25px; flex-wrap: wrap;">
          <div style="flex-shrink: 0; text-align: center;">
            <div style="background: white; padding: 15px; border-radius: 12px; border: 3px solid #c61619; box-shadow: 0 4px 8px rgba(198,22,25,0.25);">
              <img src="${qrCodeUrl}" alt="QR Code del Ticket ${escapeHtml(ticket.ticket_code)}" style="width: 180px; height: 180px; display: block;" />
            </div>
            <div style="margin-top: 12px; background: linear-gradient(135deg, #c61619 0%, #a01316 100%); padding: 8px 16px; border-radius: 8px;">
              <p style="margin: 0; font-size: 12px; color: #fff; font-weight: bold; letter-spacing: 1px;">ESCANEA EN EL EVENTO</p>
            </div>
          </div>
          <div style="flex: 1; min-width: 280px;">
            <div style="background: linear-gradient(135deg, #c61619 0%, #a01316 100%); color: white; padding: 12px 18px; border-radius: 10px; margin-bottom: 16px; box-shadow: 0 4px 8px rgba(198,22,25,0.3);">
              <h3 style="margin: 0; font-size: 18px; font-weight: bold; letter-spacing: 3px; text-align: center;">TICKET #${index + 1}</h3>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 10px 0; border-bottom: 2px solid #e9ecef;"><strong style="color: #495057; font-size: 14px;">Codigo:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #e9ecef; text-align: right;"><span style="font-family: 'Courier New', monospace; font-size: 15px; font-weight: bold; color: #c61619;">${escapeHtml(ticket.ticket_code)}</span></td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 2px solid #e9ecef;"><strong style="color: #495057; font-size: 14px;">Evento:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #e9ecef; text-align: right;"><span style="font-size: 14px; font-weight: 600; color: #212529;">${eventName}</span></td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 2px solid #e9ecef;"><strong style="color: #495057; font-size: 14px;">Fecha:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #e9ecef; text-align: right;"><span style="font-size: 14px; color: #212529;">${formatDate(ticket.event_date)}</span></td></tr>
              ${ticket.event_time ? `<tr><td style="padding: 10px 0; border-bottom: 2px solid #e9ecef;"><strong style="color: #495057; font-size: 14px;">Hora:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #e9ecef; text-align: right;"><span style="font-size: 14px; font-weight: 600; color: #212529;">${escapeHtml(ticket.event_time)}</span></td></tr>` : ""}
              ${eventLocation ? `<tr><td style="padding: 10px 0; border-bottom: 2px solid #e9ecef;"><strong style="color: #495057; font-size: 14px;">Ubicacion:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #e9ecef; text-align: right;"><span style="font-size: 13px; color: #212529;">${eventLocation}</span></td></tr>` : ""}
              ${ticketClass ? `<tr><td style="padding: 10px 0; border-bottom: 2px solid #e9ecef;"><strong style="color: #495057; font-size: 14px;">Clase:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #e9ecef; text-align: right;"><span style="background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%); color: #000; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: bold; text-transform: uppercase;">${ticketClass}</span></td></tr>` : ""}
              ${seatNumber ? `<tr><td style="padding: 10px 0; border-bottom: 2px solid #e9ecef;"><strong style="color: #495057; font-size: 14px;">Asiento:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #e9ecef; text-align: right;"><span style="font-size: 16px; font-weight: bold; color: #212529;">${seatNumber}</span></td></tr>` : ""}
              <tr><td style="padding: 10px 0; border-bottom: 2px solid #e9ecef;"><strong style="color: #495057; font-size: 14px;">Precio:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #e9ecef; text-align: right;"><span style="font-size: 18px; font-weight: bold; color: #28a745;">$${Number(ticket.price ?? 0).toFixed(2)} USD</span></td></tr>
              ${pin ? `<tr><td colspan="2" style="padding: 16px 0;"><div style="background: linear-gradient(135deg, #c61619 0%, #a01316 100%); padding: 18px; border-radius: 12px; text-align: center; box-shadow: 0 4px 12px rgba(198,22,25,0.4);"><p style="margin: 0 0 6px 0; color: #fff; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">PIN DE VALIDACION</p><p style="margin: 0; color: #fff; font-size: 32px; font-weight: bold; letter-spacing: 12px; font-family: 'Courier New', monospace; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${pin}</p><p style="margin: 8px 0 0 0; color: #ffebee; font-size: 11px; font-weight: 600;">Requerido para ingresar al evento</p></div></td></tr>` : ""}
            </table>
          </div>
        </div>
      </div>`;
  }).join("");
}

function buildEmailHtml(name: string, tickets: TicketRow[]): string {
  return `<!DOCTYPE html>
    <html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Boletas Veltlix</title></head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f4f4f4 0%, #e9ecef 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;"><tr><td align="center" style="padding: 50px 20px;">
        <table role="presentation" style="max-width: 650px; width: 100%; background-color: #ffffff; border-radius: 20px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); overflow: hidden;">
          <tr><td style="background: linear-gradient(135deg, #c61619 0%, #a01316 100%); padding: 40px; text-align: center;"><h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: bold; text-transform: uppercase; letter-spacing: 4px;">VELTLIX</h1><p style="margin: 12px 0 0 0; color: #ffebee; font-size: 16px;">Reenvio de boletas</p></td></tr>
          <tr><td style="padding: 40px 40px 15px 40px;"><h2 style="margin: 0 0 18px 0; color: #212529; font-size: 26px; font-weight: bold;">Hola ${escapeHtml(name)}</h2><p style="margin: 0; color: #495057; font-size: 16px; line-height: 1.7;">Te reenviamos tus boletas digitales. Cada boleta tiene su propio codigo, PIN y QR.</p></td></tr>
          <tr><td style="padding: 0 40px 25px 40px;">${buildTicketsHtml(tickets)}</td></tr>
          <tr><td style="padding: 0 40px 35px 40px;"><div style="background: #fff3cd; padding: 25px; border-radius: 14px; border-left: 5px solid #ffc107;"><p style="margin: 0 0 14px 0; color: #856404; font-size: 18px; font-weight: bold;">Informacion importante</p><ul style="margin: 0; padding-left: 22px; color: #856404; font-size: 15px; line-height: 1.9;"><li>Presenta el codigo QR de cada ticket en el evento</li><li>El PIN puede ser requerido al ingresar</li><li>No compartas tus codigos con nadie</li></ul></div></td></tr>
          <tr><td style="background-color: #f8f9fa; padding: 35px 40px; border-top: 2px solid #e9ecef;"><p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.6;">Saludos,<br><strong style="color: #c61619; font-size: 16px;">El equipo de Veltlix</strong></p></td></tr>
        </table>
      </td></tr></table>
    </body></html>`;
}

function buildEmailText(name: string, tickets: TicketRow[]): string {
  return `VELTLIX - REENVIO DE BOLETAS\n\nHola ${name}\n\nTe reenviamos tus boletas digitales.\n\n${tickets.map((ticket, index) => `TICKET #${index + 1}\nCodigo: ${ticket.ticket_code}\nEvento: ${ticket.event_name || "Evento"}\nFecha: ${formatDate(ticket.event_date)}\n${ticket.event_time ? `Hora: ${ticket.event_time}\n` : ""}${ticket.event_location ? `Ubicacion: ${ticket.event_location}\n` : ""}${ticket.ticket_class ? `Clase: ${ticket.ticket_class}\n` : ""}${ticket.seat_number ? `Asiento: ${ticket.seat_number}\n` : ""}${ticket.pin ? `PIN: ${ticket.pin}\n` : ""}QR: ${ticketQrData(ticket)}`).join("\n\n")}\n\nNo compartas tus codigos con nadie.`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse(req);
  if (req.method !== "POST") return json(req, 405, { ok: false, error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceKey) return json(req, 500, { ok: false, error: "Server not configured" });

  const role = await verifyRole(req, supabaseUrl, supabaseServiceKey, ["admin"]);
  if (role.error || !role.user) return json(req, 401, { ok: false, error: role.error ?? "Admin role required" });

  let body: ResendBody;
  try {
    body = await req.json();
  } catch {
    return json(req, 400, { ok: false, error: "Invalid JSON body" });
  }

  const ticketIds = [...new Set((body.ticket_ids ?? []).filter((id) => typeof id === "string" && id.trim()).map((id) => id.trim()))];
  if (ticketIds.length === 0) return json(req, 400, { ok: false, error: "Selecciona al menos una boleta" });
  if (ticketIds.length > MAX_TICKETS) return json(req, 400, { ok: false, error: `Maximo ${MAX_TICKETS} boletas por envio` });

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data, error } = await supabase
    .from("tickets")
    .select("id, ticket_code, qr_code, event_name, event_date, event_time, event_location, ticket_class, seat_number, price, pin, buyer_email, buyer_full_name, purchase_id, order_uuid")
    .in("id", ticketIds)
    .order("buyer_email", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return json(req, 500, { ok: false, error: `Error consultando boletas: ${error.message}` });
  const tickets = (data ?? []) as TicketRow[];
  if (tickets.length !== ticketIds.length) return json(req, 404, { ok: false, error: "Una o mas boletas no existen" });

  const groups = new Map<string, TicketRow[]>();
  for (const ticket of tickets) {
    const email = ticket.buyer_email?.trim().toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json(req, 400, { ok: false, error: `Boleta ${ticket.ticket_code} no tiene email valido` });
    }
    groups.set(email, [...(groups.get(email) ?? []), ticket]);
  }

  const results: { email: string; count: number }[] = [];
  for (const [email, emailTickets] of groups.entries()) {
    const name = emailTickets.find((ticket) => ticket.buyer_full_name)?.buyer_full_name || "Cliente";
    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        to: email,
        subject: `Reenvio de ${emailTickets.length} boleta${emailTickets.length !== 1 ? "s" : ""} - Veltlix`,
        text: buildEmailText(name, emailTickets),
        html: buildEmailHtml(name, emailTickets),
      }),
    });

    if (!emailResponse.ok) {
      const details = await emailResponse.text();
      return json(req, 500, { ok: false, error: `No se pudo enviar email a ${email}: ${details}` });
    }
    results.push({ email, count: emailTickets.length });
  }

  await supabase.from("admin_audit_log").insert({
    actor_id: role.user.id,
    actor_email: role.user.email,
    action: "ticket.resend_selected",
    target_type: "tickets",
    target_id: ticketIds.join(","),
    after_data: {
      ticket_ids: ticketIds,
      recipients: results,
    },
    ip_address: req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip"),
    user_agent: req.headers.get("user-agent"),
  });

  return json(req, 200, {
    ok: true,
    sent_count: tickets.length,
    recipient_count: results.length,
    recipients: results,
  });
});
