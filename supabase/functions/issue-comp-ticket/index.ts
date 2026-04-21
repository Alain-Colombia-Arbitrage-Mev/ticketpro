/**
 * Supabase Edge Function: Issue Comp Ticket (Cortesías)
 *
 * Emite boletas de cortesía (comp) sin pago. Solo administradores pueden
 * invocarla. Registra la acción en admin_audit_log para trazabilidad.
 *
 * Body (JSON):
 *   - event_id: number (required)
 *   - buyer_email: string (required)
 *   - buyer_full_name: string (required)
 *   - issue_reason: string (required, e.g. "staff", "press", "VIP invite")
 *   - quantity: number (1..20, default 1)
 *   - ticket_type?: string (default "Cortesía")
 *   - seat_type?: string
 *   - gate_number?: string
 *
 * Env:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - FRONTEND_URL (for QR URLs)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { CORS_HEADERS, corsResponse } from "../_shared/cors.ts";
import { verifyRole } from "../_shared/auth.ts";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_QUANTITY = 20;

function randomCode(length = 12): string {
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (v) => CODE_CHARS[v % CODE_CHARS.length]).join("");
}

function randomPin(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(1000 + (array[0] % 9000));
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

interface IssueBody {
  event_id?: number;
  buyer_email?: string;
  buyer_full_name?: string;
  issue_reason?: string;
  quantity?: number;
  ticket_type?: string;
  seat_type?: string;
  gate_number?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceKey) {
    return json(500, { error: "Server not configured" });
  }

  // Require admin role
  const role = await verifyRole(req, supabaseUrl, supabaseServiceKey, ["admin"]);
  if (role.error || !role.user) {
    return json(401, { error: role.error ?? "Admin role required" });
  }
  const actor = role.user;

  let body: IssueBody;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  // Validate
  const eventId = Number(body.event_id);
  const buyerEmail = body.buyer_email?.trim().toLowerCase();
  const buyerName = body.buyer_full_name?.trim();
  const reason = body.issue_reason?.trim();
  const quantity = Math.max(1, Math.min(MAX_QUANTITY, Number(body.quantity ?? 1)));
  const ticketType = body.ticket_type?.trim() || "Cortesía";

  if (!Number.isFinite(eventId) || eventId <= 0) return json(400, { error: "event_id inválido" });
  if (!buyerEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(buyerEmail))
    return json(400, { error: "buyer_email inválido" });
  if (!buyerName) return json(400, { error: "buyer_full_name requerido" });
  if (!reason) return json(400, { error: "issue_reason requerido" });

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch event to denormalize on the ticket
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, title, date, time, location, category")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) return json(500, { error: "Error al consultar evento", details: eventError.message });
  if (!event) return json(404, { error: "Evento no encontrado" });

  // Resolve buyer_id if buyer has an account (trigger also handles this on INSERT)
  const { data: buyerProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", buyerEmail)
    .maybeSingle();

  const nowIso = new Date().toISOString();
  const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://veltlix.com";

  // Build N records. Pin + code are generated per ticket; qr_code is patched post-insert with the real id.
  const records = Array.from({ length: quantity }, () => {
    const code = `C-${randomCode(10)}`;
    const tempId = crypto.randomUUID();
    return {
      ticket_code: code,
      pin: randomPin(),
      qr_code: `${frontendUrl}/validate-ticket?ticketId=${tempId}&code=${code}`,
      status: "issued_unused",
      event_id: eventId,
      event_name: event.title,
      event_date: event.date,
      event_time: event.time,
      event_location: event.location,
      event_category: event.category,
      buyer_email: buyerEmail,
      buyer_id: buyerProfile?.id ?? null,
      buyer_full_name: buyerName,
      ticket_type: ticketType,
      ticket_class: ticketType,
      seat_type: body.seat_type ?? null,
      gate_number: body.gate_number ?? null,
      price: 0,
      price_paid: 0,
      is_comp: true,
      issued_by: actor.id,
      issue_reason: reason,
      purchase_date: nowIso,
      purchase_summary: {
        source: "comp_issue",
        issued_by: { id: actor.id, email: actor.email },
        issue_reason: reason,
        issued_at: nowIso,
      },
      metadata: {
        source: "issue-comp-ticket",
        issued_at: nowIso,
      },
    };
  });

  const { data: inserted, error: insertError } = await supabase
    .from("tickets")
    .insert(records)
    .select("id, ticket_code");

  if (insertError) {
    return json(500, { error: "No se pudieron insertar las boletas", details: insertError.message });
  }

  // Patch qr_code with real ticket id
  if (inserted && inserted.length > 0) {
    for (const t of inserted) {
      const qr = `${frontendUrl}/validate-ticket?ticketId=${t.id}&code=${t.ticket_code}`;
      await supabase.from("tickets").update({ qr_code: qr, updated_at: new Date().toISOString() }).eq("id", t.id);
    }
  }

  // Audit trail
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const userAgent = req.headers.get("user-agent") || null;

  await supabase.from("admin_audit_log").insert({
    actor_id: actor.id,
    actor_email: actor.email,
    action: "ticket.issue_comp",
    target_type: "event",
    target_id: String(eventId),
    after_data: {
      event_id: eventId,
      buyer_email: buyerEmail,
      buyer_full_name: buyerName,
      issue_reason: reason,
      quantity,
      ticket_type: ticketType,
      ticket_ids: inserted?.map((t) => t.id) ?? [],
    },
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  return json(200, {
    ok: true,
    count: inserted?.length ?? 0,
    tickets: inserted ?? [],
  });
});
