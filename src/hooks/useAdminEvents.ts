import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../utils/supabase/client";

export interface AdminEventRow {
  id: number;
  title: string;
  date: string;
  time: string | null;
  location: string;
  category: string;
  description: string | null;
  image_url: string | null;
  image_slider_url: string | null;
  image_card_url: string | null;
  image_detail_url: string | null;
  base_price: number;
  currency: string | null;
  is_active: boolean | null;
  featured: boolean | null;
  trending: boolean | null;
  sold_out: boolean | null;
  last_tickets: boolean | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AdminEventInput {
  title: string;
  date: string;
  time?: string | null;
  location: string;
  category: string;
  description?: string | null;
  image_url?: string | null;
  image_slider_url?: string | null;
  image_card_url?: string | null;
  image_detail_url?: string | null;
  base_price: number;
  currency?: string;
  is_active?: boolean;
  featured?: boolean;
  trending?: boolean;
  sold_out?: boolean;
  last_tickets?: boolean;
}

export interface EventHosterRow {
  id: string;
  event_id: number;
  user_id: string;
  assigned_at: string;
  profile?: { email: string | null; name: string | null; role: string | null } | null;
}

export interface EventListFilters {
  search?: string;
  category?: string;
  status?: "active" | "inactive" | "all";
  from?: string;
  to?: string;
}

const EVENTS_KEY = ["admin", "events"] as const;
const HOSTERS_KEY = (eventId: number) => ["admin", "event_hosters", eventId] as const;

export function useAdminEvents(filters: EventListFilters = {}) {
  return useQuery({
    queryKey: [...EVENTS_KEY, filters],
    queryFn: async (): Promise<AdminEventRow[]> => {
      let q = supabase
        .from("events")
        .select(
          "id, title, date, time, location, category, description, image_url, image_slider_url, image_card_url, image_detail_url, base_price, currency, is_active, featured, trending, sold_out, last_tickets, metadata, created_at, updated_at",
        )
        .order("date", { ascending: false })
        .limit(500);

      if (filters.search?.trim()) {
        const s = filters.search.replace(/[,()]/g, "").trim();
        q = q.or(`title.ilike.%${s}%,location.ilike.%${s}%,category.ilike.%${s}%`);
      }
      if (filters.category) q = q.eq("category", filters.category);
      if (filters.status === "active") q = q.eq("is_active", true);
      if (filters.status === "inactive") q = q.eq("is_active", false);
      if (filters.from) q = q.gte("date", filters.from);
      if (filters.to) q = q.lte("date", filters.to);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AdminEventRow[];
    },
    staleTime: 30_000,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AdminEventInput): Promise<AdminEventRow> => {
      const { data, error } = await supabase
        .from("events")
        .insert({ currency: "USD", is_active: true, ...input })
        .select()
        .single();
      if (error) throw error;
      return data as AdminEventRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EVENTS_KEY }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: number;
      patch: Partial<AdminEventInput>;
    }): Promise<AdminEventRow> => {
      const { data, error } = await supabase
        .from("events")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as AdminEventRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EVENTS_KEY });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EVENTS_KEY }),
  });
}

export function useToggleEventFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      flag,
      value,
    }: {
      id: number;
      flag: "is_active" | "featured" | "trending" | "sold_out" | "last_tickets";
      value: boolean;
    }) => {
      const { error } = await supabase
        .from("events")
        .update({ [flag]: value, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EVENTS_KEY }),
  });
}

export function useEventHosters(eventId: number | null) {
  return useQuery({
    queryKey: eventId ? HOSTERS_KEY(eventId) : ["admin", "event_hosters", "none"],
    enabled: !!eventId,
    queryFn: async (): Promise<EventHosterRow[]> => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from("event_hosters")
        .select(
          "id, event_id, user_id, assigned_at, profile:profiles!event_hosters_user_id_fkey(email, name, role)",
        )
        .eq("event_id", eventId);

      // If FK alias fails (relationship not known to PostgREST), fall back to plain select + separate profile lookup.
      if (error?.message?.includes("foreign key") || error?.code === "PGRST200") {
        const plain = await supabase
          .from("event_hosters")
          .select("id, event_id, user_id, assigned_at")
          .eq("event_id", eventId);
        if (plain.error) throw plain.error;
        const ids = plain.data?.map((r) => r.user_id) ?? [];
        if (!ids.length) return [];
        const profiles = await supabase
          .from("profiles")
          .select("id, email, name, role")
          .in("id", ids);
        const byId = new Map<string, { email: string | null; name: string | null; role: string | null }>();
        profiles.data?.forEach((p) => byId.set(p.id, { email: p.email, name: p.name, role: p.role }));
        return (plain.data ?? []).map((r) => ({ ...r, profile: byId.get(r.user_id) ?? null })) as EventHosterRow[];
      }
      if (error) throw error;
      return (data ?? []) as unknown as EventHosterRow[];
    },
  });
}

export function useAssignHoster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      userId,
      assignedBy,
    }: {
      eventId: number;
      userId: string;
      assignedBy: string;
    }) => {
      const { error } = await supabase
        .from("event_hosters")
        .insert({ event_id: eventId, user_id: userId, assigned_by: assignedBy });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: HOSTERS_KEY(vars.eventId) });
    },
  });
}

export function useUnassignHoster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, eventId: _eventId }: { id: string; eventId: number }) => {
      const { error } = await supabase.from("event_hosters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: HOSTERS_KEY(vars.eventId) });
    },
  });
}

export function useSearchHosterCandidates(search: string) {
  return useQuery({
    queryKey: ["admin", "hoster_candidates", search],
    enabled: search.trim().length >= 2,
    queryFn: async () => {
      const s = search.replace(/[,()]/g, "").trim();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, name, role")
        .in("role", ["hoster", "admin"])
        .or(`email.ilike.%${s}%,name.ilike.%${s}%`)
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10_000,
  });
}
