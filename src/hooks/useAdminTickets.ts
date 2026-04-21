import { useQuery } from "@tanstack/react-query";
import { supabase } from "../utils/supabase/client";

export type TicketStatus =
  | "active"
  | "issued_unused"
  | "issued_used"
  | "used"
  | "expired"
  | "cancelled"
  | "refunded";

export interface AdminTicketRow {
  id: string;
  ticket_code: string;
  qr_code: string | null;
  event_id: number | null;
  event_name: string | null;
  event_date: string | null;
  event_time: string | null;
  event_location: string | null;
  buyer_id: string | null;
  buyer_email: string;
  buyer_full_name: string | null;
  status: TicketStatus | string;
  price: number | null;
  price_paid: number | null;
  is_comp: boolean | null;
  issued_by: string | null;
  issue_reason: string | null;
  used_at: string | null;
  used_by: string | null;
  validation_code: string | null;
  gate_number: string | null;
  seat_number: string | null;
  seat_type: string | null;
  ticket_type: string | null;
  ticket_class: string | null;
  order_uuid: string | null;
  purchase_date: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminTicketsFilters {
  search?: string;
  eventId?: number | null;
  status?: string;
  isComp?: boolean;
  from?: string;
  to?: string;
}

const PAGE_SIZE = 25;

export function useAdminTickets(filters: AdminTicketsFilters, page: number) {
  return useQuery({
    queryKey: ["admin", "tickets", filters, page],
    queryFn: async () => {
      let q = supabase
        .from("tickets")
        .select(
          "id, ticket_code, qr_code, event_id, event_name, event_date, event_time, event_location, buyer_id, buyer_email, buyer_full_name, status, price, price_paid, is_comp, issued_by, issue_reason, used_at, used_by, validation_code, gate_number, seat_number, seat_type, ticket_type, ticket_class, order_uuid, purchase_date, metadata, created_at",
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (filters.search?.trim()) {
        const s = filters.search.replace(/[,()]/g, "").trim();
        q = q.or(`ticket_code.ilike.%${s}%,buyer_email.ilike.%${s}%,buyer_full_name.ilike.%${s}%`);
      }
      if (filters.eventId) q = q.eq("event_id", filters.eventId);
      if (filters.status) q = q.eq("status", filters.status);
      if (filters.isComp !== undefined) q = q.eq("is_comp", filters.isComp);
      if (filters.from) q = q.gte("created_at", filters.from);
      if (filters.to) q = q.lte("created_at", filters.to);

      const { data, count, error } = await q;
      if (error) throw error;
      return {
        rows: (data ?? []) as AdminTicketRow[],
        total: count ?? 0,
      };
    },
    staleTime: 15_000,
  });
}

export const TICKETS_PAGE_SIZE = PAGE_SIZE;

export interface StatusBreakdown {
  status: string;
  count: number;
}

export function useTicketStatusBreakdown(eventId: number | null) {
  return useQuery({
    queryKey: ["admin", "tickets", "breakdown", eventId],
    queryFn: async (): Promise<StatusBreakdown[]> => {
      // Single roundtrip: pull only the status column for the scope
      let q = supabase.from("tickets").select("status").limit(10000);
      if (eventId) q = q.eq("event_id", eventId);
      const { data, error } = await q;
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((r) => {
        const s = (r as { status: string }).status || "unknown";
        counts[s] = (counts[s] ?? 0) + 1;
      });
      return Object.entries(counts)
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);
    },
    staleTime: 15_000,
  });
}

export interface TicketDetail extends AdminTicketRow {
  order?: {
    id: string;
    order_id: string;
    payment_status: string;
    payment_method: string | null;
    total_amount: number;
    created_at: string;
  } | null;
  issued_by_profile?: { email: string | null; name: string | null } | null;
  used_by_profile?: { email: string | null; name: string | null } | null;
}

export function useTicketDetail(ticketId: string | null) {
  return useQuery({
    queryKey: ["admin", "ticket_detail", ticketId],
    enabled: !!ticketId,
    queryFn: async (): Promise<TicketDetail | null> => {
      if (!ticketId) return null;
      const { data: t, error } = await supabase
        .from("tickets")
        .select(
          "id, ticket_code, qr_code, event_id, event_name, event_date, event_time, event_location, buyer_id, buyer_email, buyer_full_name, status, price, price_paid, is_comp, issued_by, issue_reason, used_at, used_by, validation_code, gate_number, seat_number, seat_type, ticket_type, ticket_class, order_uuid, purchase_date, metadata, created_at",
        )
        .eq("id", ticketId)
        .maybeSingle();
      if (error) throw error;
      if (!t) return null;

      const detail: TicketDetail = { ...(t as AdminTicketRow) };

      // Join order if present
      if (t.order_uuid) {
        const { data: order } = await supabase
          .from("orders")
          .select("id, order_id, payment_status, payment_method, total_amount, created_at")
          .eq("id", t.order_uuid)
          .maybeSingle();
        detail.order = (order as TicketDetail["order"]) ?? null;
      }

      // Join profiles for issued_by / used_by
      const profileIds = [t.issued_by, t.used_by].filter(Boolean) as string[];
      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, name")
          .in("id", profileIds);
        const byId = new Map(profiles?.map((p) => [p.id, { email: p.email, name: p.name }]) ?? []);
        if (t.issued_by) detail.issued_by_profile = byId.get(t.issued_by) ?? null;
        if (t.used_by) detail.used_by_profile = byId.get(t.used_by) ?? null;
      }

      return detail;
    },
  });
}

export interface LifecycleEvent {
  key: string;
  label: string;
  timestamp: string | null;
  status: "done" | "pending" | "skipped" | "failed";
  description?: string;
}

export function buildLifecycleTimeline(t: TicketDetail): LifecycleEvent[] {
  const events: LifecycleEvent[] = [];

  // 1. Purchase / Issuance
  if (t.is_comp) {
    events.push({
      key: "issued_comp",
      label: "Emitido como cortesía",
      timestamp: t.created_at,
      status: "done",
      description: t.issue_reason
        ? `Motivo: ${t.issue_reason}${t.issued_by_profile ? ` · por ${t.issued_by_profile.name ?? t.issued_by_profile.email ?? t.issued_by}` : ""}`
        : t.issued_by_profile
          ? `Por ${t.issued_by_profile.name ?? t.issued_by_profile.email ?? t.issued_by}`
          : undefined,
    });
  } else {
    events.push({
      key: "purchase",
      label: "Compra iniciada",
      timestamp: t.purchase_date ?? t.created_at,
      status: "done",
      description: t.order?.order_id
        ? `Orden ${t.order.order_id} · ${t.order.payment_method ?? "?"}`
        : "Sin orden vinculada",
    });
  }

  // 2. Payment (skip for comp)
  if (!t.is_comp) {
    const ps = t.order?.payment_status;
    events.push({
      key: "payment",
      label: "Pago",
      timestamp: ps === "paid" || ps === "completed" ? t.order?.created_at ?? null : null,
      status:
        ps === "paid" || ps === "completed"
          ? "done"
          : ps === "failed" || ps === "fraud_detected"
            ? "failed"
            : ps === "refunded"
              ? "skipped"
              : "pending",
      description: ps ? `Estado: ${ps}` : "Sin información de pago",
    });
  }

  // 3. Ticket issued (QR available)
  events.push({
    key: "issued",
    label: "Boleta emitida",
    timestamp: t.created_at,
    status: t.qr_code ? "done" : "pending",
    description: `Código ${t.ticket_code}`,
  });

  // 4. Validated at gate
  if (t.status === "issued_used" || t.status === "used" || t.used_at) {
    const validatedBy = t.used_by_profile?.name ?? t.used_by_profile?.email ?? t.used_by ?? "desconocido";
    events.push({
      key: "validated",
      label: "Validada en acceso",
      timestamp: t.used_at,
      status: "done",
      description: `${t.gate_number ? `Puerta ${t.gate_number} · ` : ""}por ${validatedBy}${t.validation_code ? ` · código ${t.validation_code}` : ""}`,
    });
  } else if (t.status === "cancelled") {
    events.push({ key: "cancelled", label: "Cancelada", timestamp: null, status: "failed" });
  } else if (t.status === "refunded") {
    events.push({ key: "refunded", label: "Reembolsada", timestamp: null, status: "failed" });
  } else if (t.status === "expired") {
    events.push({ key: "expired", label: "Expirada (fecha pasada)", timestamp: null, status: "skipped" });
  } else {
    events.push({ key: "awaiting_validation", label: "Pendiente de validación", timestamp: null, status: "pending" });
  }

  return events;
}
