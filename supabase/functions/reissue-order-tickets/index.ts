/**
 * Supabase Edge Function: Reissue Order Tickets
 *
 * Admin-only action. Ensures a paid order has one ticket per purchased quantity,
 * patches missing QR URLs, and resends the purchase receipt to the buyer.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { verifyRole } from "../_shared/auth.ts";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PAID_STATUSES = new Set(["paid", "completed"]);

type JsonRecord = Record<string, unknown>;

interface ReissueBody {
  order_id?: string;
  order_uuid?: string;
}

interface OrderRow {
  id: string;
  order_id: string;
  buyer_email: string;
  buyer_name: string | null;
  buyer_address: string | null;
  payment_method: string | null;
  payment_status: string;
  total_amount: number;
  currency: string | null;
  items: unknown;
  stripe_session_id: string | null;
  metadata: JsonRecord | null;
  created_at: string;
}

interface TicketRow {
  id: string;
  ticket_code: string;
  qr_code: string | null;
  purchase_id: string | null;
  status: string;
}

function json(req: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(req) },
  });
}

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

function getString(item: JsonRecord, camelKey: string, snakeKey: string, fallback = ""): string {
  const value = item[camelKey] ?? item[snakeKey];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getNumber(item: JsonRecord, camelKey: string, snakeKey: string, fallback = 0): number {
  const value = item[camelKey] ?? item[snakeKey];
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getNullableString(item: JsonRecord, camelKey: string, snakeKey: string): string | null {
  const value = item[camelKey] ?? item[snakeKey];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function expandPurchasedItems(items: unknown): JsonRecord[] {
  if (!Array.isArray(items)) return [];

  const expanded: JsonRecord[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as JsonRecord;
    const quantity = Math.max(1, Math.min(100, Math.floor(Number(item.quantity ?? 1))));
    for (let i = 0; i < quantity; i++) expanded.push(item);
  }
  return expanded;
}

function buildTicketRecord(order: OrderRow, item: JsonRecord, frontendUrl: string) {
  const nowIso = new Date().toISOString();
  const ticketCode = randomCode(12);
  const tempId = crypto.randomUUID();
  const paymentMethod = order.payment_method === "cryptomus" ? "crypto" : order.payment_method || "stripe";
  const eventId = getNumber(item, "eventId", "event_id");
  const buyerName = order.buyer_name || getString(item, "buyerFullName", "buyer_full_name", "Cliente");

  return {
    ticket_code: ticketCode,
    pin: randomPin(),
    qr_code: `${frontendUrl}/validate-ticket?ticketId=${tempId}&code=${ticketCode}`,
    status: "issued_unused",
    event_id: eventId,
    event_name: getString(item, "eventName", "event_name", "Evento"),
    event_date: getString(item, "eventDate", "event_date", nowIso.split("T")[0]),
    event_time: getNullableString(item, "eventTime", "event_time"),
    event_location: getNullableString(item, "eventLocation", "event_location"),
    event_category: getNullableString(item, "eventCategory", "event_category"),
    buyer_email: order.buyer_email,
    buyer_id: null,
    buyer_full_name: buyerName,
    buyer_address: order.buyer_address ?? getNullableString(item, "buyerAddress", "buyer_address"),
    ticket_type: getString(item, "ticketType", "ticket_type", "General"),
    seat_number: getNullableString(item, "seatNumber", "seat_number"),
    seat_type: getString(item, "seatType", "seat_type", "general"),
    gate_number: getNullableString(item, "gateNumber", "gate_number"),
    ticket_class: getString(item, "ticketClass", "ticket_class", getString(item, "ticketType", "ticket_type", "General")),
    ticket_category_id: item.ticketCategoryId ?? item.ticket_category_id ?? null,
    price: getNumber(item, "price", "price", 0),
    price_paid: getNumber(item, "price", "price", 0),
    payment_method_id: paymentMethod === "crypto" ? "crypto" : "11111111-1111-1111-1111-111111111111",
    order_uuid: order.id,
    purchase_id: order.order_id,
    purchase_date: order.created_at,
    purchase_summary: {
      reissued: true,
      reissued_at: nowIso,
      paymentMethod,
      orderId: order.order_id,
      stripeSessionId: order.stripe_session_id,
    },
    metadata: {
      source: "reissue-order-tickets",
      reissued_at: nowIso,
    },
  };
}

async function fetchOrder(supabase: ReturnType<typeof createClient>, body: ReissueBody) {
  let query = supabase
    .from("orders")
    .select("id, order_id, buyer_email, buyer_name, buyer_address, payment_method, payment_status, total_amount, currency, items, stripe_session_id, metadata, created_at");

  if (body.order_uuid) query = query.eq("id", body.order_uuid);
  else if (body.order_id) query = query.eq("order_id", body.order_id);
  else throw new Error("order_id u order_uuid requerido");

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`Error consultando orden: ${error.message}`);
  return data as OrderRow | null;
}

async function fetchTickets(supabase: ReturnType<typeof createClient>, order: OrderRow): Promise<TicketRow[]> {
  const byId = new Map<string, TicketRow>();

  const { data: byUuid, error: uuidError } = await supabase
    .from("tickets")
    .select("id, ticket_code, qr_code, purchase_id, status")
    .eq("order_uuid", order.id)
    .order("created_at", { ascending: true });
  if (uuidError) throw new Error(`Error consultando boletas: ${uuidError.message}`);
  (byUuid ?? []).forEach((ticket) => byId.set(ticket.id, ticket as TicketRow));

  const { data: byPurchaseId, error: purchaseError } = await supabase
    .from("tickets")
    .select("id, ticket_code, qr_code, purchase_id, status")
    .eq("purchase_id", order.order_id)
    .order("created_at", { ascending: true });
  if (purchaseError) throw new Error(`Error consultando boletas: ${purchaseError.message}`);
  (byPurchaseId ?? []).forEach((ticket) => byId.set(ticket.id, ticket as TicketRow));

  return Array.from(byId.values());
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse(req);
  if (req.method !== "POST") return json(req, 405, { ok: false, error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceKey) return json(req, 500, { ok: false, error: "Server not configured" });

  const role = await verifyRole(req, supabaseUrl, supabaseServiceKey, ["admin"]);
  if (role.error || !role.user) return json(req, 401, { ok: false, error: role.error ?? "Admin role required" });

  let body: ReissueBody;
  try {
    body = await req.json();
  } catch {
    return json(req, 400, { ok: false, error: "Invalid JSON body" });
  }

  const orderId = body.order_id?.trim();
  const orderUuid = body.order_uuid?.trim();
  if (!orderId && !orderUuid) return json(req, 400, { ok: false, error: "order_id u order_uuid requerido" });

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const order = await fetchOrder(supabase, { order_id: orderId, order_uuid: orderUuid });
    if (!order) return json(req, 404, { ok: false, error: "Orden no encontrada" });
    if (!PAID_STATUSES.has(order.payment_status)) {
      return json(req, 409, { ok: false, error: `La orden no esta pagada (${order.payment_status})` });
    }

    const expandedItems = expandPurchasedItems(order.items);
    const existingTickets = await fetchTickets(supabase, order);
    const missingCount = Math.max(0, expandedItems.length - existingTickets.length);
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://veltlix.com";
    let createdTickets: TicketRow[] = [];

    if (missingCount > 0) {
      const missingItems = expandedItems.slice(existingTickets.length);
      const records = missingItems.map((item) => buildTicketRecord(order, item, frontendUrl));
      const { data: inserted, error: insertError } = await supabase
        .from("tickets")
        .insert(records)
        .select("id, ticket_code, qr_code, purchase_id, status");

      if (insertError) throw new Error(`No se pudieron emitir boletas faltantes: ${insertError.message}`);
      createdTickets = (inserted ?? []) as TicketRow[];
    }

    const tickets = [...existingTickets, ...createdTickets];
    if (tickets.length === 0) return json(req, 409, { ok: false, error: "La orden no tiene items ni boletas para enviar" });

    for (const ticket of tickets) {
      const qrCode = `${frontendUrl}/validate-ticket?ticketId=${ticket.id}&code=${ticket.ticket_code}`;
      if (ticket.qr_code !== qrCode || ticket.purchase_id !== order.order_id) {
        await supabase
          .from("tickets")
          .update({ qr_code: qrCode, purchase_id: order.order_id, updated_at: new Date().toISOString() })
          .eq("id", ticket.id);
      }
    }

    const receiptResponse = await fetch(`${supabaseUrl}/functions/v1/send-purchase-receipt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        orderId: order.order_id,
        customerEmail: order.buyer_email,
        customerName: order.buyer_name || "Cliente",
      }),
    });

    if (!receiptResponse.ok) {
      const details = await receiptResponse.text();
      throw new Error(`Boletas emitidas, pero falló el email: ${details}`);
    }

    await supabase.from("admin_audit_log").insert({
      actor_id: role.user.id,
      actor_email: role.user.email,
      action: "ticket.reissue_order",
      target_type: "order",
      target_id: order.id,
      after_data: {
        order_id: order.order_id,
        buyer_email: order.buyer_email,
        expected_tickets: expandedItems.length || tickets.length,
        existing_tickets: existingTickets.length,
        created_tickets: createdTickets.length,
        emailed_to: order.buyer_email,
      },
      ip_address: req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip"),
      user_agent: req.headers.get("user-agent"),
    });

    return json(req, 200, {
      ok: true,
      order_id: order.order_id,
      email: order.buyer_email,
      expected_count: expandedItems.length || tickets.length,
      existing_count: existingTickets.length,
      created_count: createdTickets.length,
      sent_count: tickets.length,
    });
  } catch (error) {
    console.error("reissue-order-tickets error:", error);
    return json(req, 500, {
      ok: false,
      error: error instanceof Error ? error.message : "Unexpected server error",
    });
  }
});
