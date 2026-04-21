import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../utils/supabase/client";

export interface ValidationEvent {
  id: string;
  ticket_code: string;
  event_id: number | null;
  event_name: string | null;
  buyer_full_name: string | null;
  buyer_email: string;
  used_at: string;
  used_by: string | null;
  used_by_name?: string | null;
  gate_number: string | null;
  validation_code: string | null;
  status: string;
  is_comp: boolean | null;
}

const FEED_CAP = 100;

/**
 * Subscribes to ticket validation events (UPDATE → status issued_used) in real time.
 * Scope:
 *   - admin (scopeEventId=null): all tickets
 *   - hoster: realtime channel is filtered by event_id; caller is expected to run
 *     one channel per event (or set a single event in the UI)
 *
 * If `scopeEventId` is a number, the channel is narrowed to that event.
 * If `scopeEventId` is null, all updates reach the channel (RLS will still filter).
 *
 * On each new validation, the feed is deduped and capped at 100 entries.
 */
export function useRealtimeValidations(scopeEventId: number | null) {
  const [feed, setFeed] = useState<ValidationEvent[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const profileCacheRef = useRef<Map<string, string>>(new Map());

  // Seed with recent validations (last 50) from the DB so the feed is not empty on mount
  const seed = useQuery({
    queryKey: ["realtime", "validations_seed", scopeEventId],
    queryFn: async (): Promise<ValidationEvent[]> => {
      let q = supabase
        .from("tickets")
        .select(
          "id, ticket_code, event_id, event_name, buyer_full_name, buyer_email, used_at, used_by, gate_number, validation_code, status, is_comp",
        )
        .not("used_at", "is", null)
        .order("used_at", { ascending: false })
        .limit(50);
      if (scopeEventId) q = q.eq("event_id", scopeEventId);
      const { data, error } = await q;
      if (error) throw error;
      const rows = (data ?? []) as ValidationEvent[];

      // Resolve validator names in one roundtrip
      const validatorIds = [...new Set(rows.map((r) => r.used_by).filter(Boolean))] as string[];
      if (validatorIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, name, email")
          .in("id", validatorIds);
        profs?.forEach((p) =>
          profileCacheRef.current.set(p.id, p.name || p.email || p.id),
        );
      }
      return rows.map((r) => ({
        ...r,
        used_by_name: r.used_by ? profileCacheRef.current.get(r.used_by) ?? null : null,
      }));
    },
    staleTime: 10_000,
  });

  // Hydrate feed from seed once
  useEffect(() => {
    if (seed.data) setFeed(seed.data.slice(0, FEED_CAP));
  }, [seed.data]);

  // Subscribe to realtime UPDATEs
  useEffect(() => {
    const channelName = `tickets-validations-${scopeEventId ?? "all"}`;
    const filter = scopeEventId ? `event_id=eq.${scopeEventId}` : undefined;

    const ch = supabase.channel(channelName).on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "tickets",
        ...(filter ? { filter } : {}),
      },
      async (payload) => {
        const newRow = payload.new as Record<string, unknown>;
        const oldRow = payload.old as Record<string, unknown>;
        // Only care about transitions into "used" states with a fresh used_at
        const becameUsed =
          (newRow.status === "issued_used" || newRow.status === "used") &&
          oldRow.status !== "issued_used" &&
          oldRow.status !== "used" &&
          !!newRow.used_at;
        if (!becameUsed) return;

        const event: ValidationEvent = {
          id: String(newRow.id),
          ticket_code: String(newRow.ticket_code ?? ""),
          event_id: (newRow.event_id as number) ?? null,
          event_name: (newRow.event_name as string) ?? null,
          buyer_full_name: (newRow.buyer_full_name as string) ?? null,
          buyer_email: String(newRow.buyer_email ?? ""),
          used_at: String(newRow.used_at),
          used_by: (newRow.used_by as string) ?? null,
          used_by_name: null,
          gate_number: (newRow.gate_number as string) ?? null,
          validation_code: (newRow.validation_code as string) ?? null,
          status: String(newRow.status),
          is_comp: (newRow.is_comp as boolean) ?? null,
        };

        // Lazy-load validator name
        if (event.used_by) {
          const cached = profileCacheRef.current.get(event.used_by);
          if (cached) {
            event.used_by_name = cached;
          } else {
            const { data: p } = await supabase
              .from("profiles")
              .select("id, name, email")
              .eq("id", event.used_by)
              .maybeSingle();
            if (p) {
              const label = p.name || p.email || p.id;
              profileCacheRef.current.set(p.id, label);
              event.used_by_name = label;
            }
          }
        }

        setFeed((prev) => {
          if (prev.some((e) => e.id === event.id)) return prev;
          return [event, ...prev].slice(0, FEED_CAP);
        });
      },
    );

    ch.subscribe();
    channelRef.current = ch;

    return () => {
      ch.unsubscribe();
      channelRef.current = null;
    };
  }, [scopeEventId]);

  return {
    feed,
    seedLoading: seed.isLoading,
    seedError: seed.error as Error | null,
    refetchSeed: seed.refetch,
  };
}

export interface GateMetric {
  gate: string;
  count: number;
}
export interface HourMetric {
  hour: string;
  count: number;
}
export interface ValidatorMetric {
  name: string;
  count: number;
}

export function computeMetrics(feed: ValidationEvent[]) {
  const byGate = new Map<string, number>();
  const byHour = new Map<string, number>();
  const byValidator = new Map<string, number>();

  feed.forEach((e) => {
    const g = e.gate_number || "(sin puerta)";
    byGate.set(g, (byGate.get(g) ?? 0) + 1);

    const d = new Date(e.used_at);
    const h = `${d.getHours().toString().padStart(2, "0")}:00`;
    byHour.set(h, (byHour.get(h) ?? 0) + 1);

    const v = e.used_by_name || e.used_by || "(desconocido)";
    byValidator.set(v, (byValidator.get(v) ?? 0) + 1);
  });

  const gates: GateMetric[] = [...byGate.entries()]
    .map(([gate, count]) => ({ gate, count }))
    .sort((a, b) => b.count - a.count);
  const hours: HourMetric[] = [...byHour.entries()]
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => (a.hour > b.hour ? 1 : -1));
  const validators: ValidatorMetric[] = [...byValidator.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return { gates, hours, validators, total: feed.length };
}
