import { useQuery } from "@tanstack/react-query";
import { supabase } from "../utils/supabase/client";
import { useAuth } from "./useAuth";

export interface AssignedEventScope {
  isAdmin: boolean;
  eventIds: number[] | null; // null = admin (no restriction)
  loading: boolean;
}

/**
 * Returns the set of event_ids the current user can access:
 *  - admin: null  → no restriction (all events)
 *  - hoster: array of assigned event_ids from `event_hosters`
 *  - other: empty array
 */
export function useAssignedEvents(): AssignedEventScope {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin";
  const isHoster = user?.role === "hoster";

  const q = useQuery({
    queryKey: ["admin", "assigned_events", user?.id],
    enabled: !!user && isHoster,
    queryFn: async (): Promise<number[]> => {
      const { data, error } = await supabase
        .from("event_hosters")
        .select("event_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.event_id as number);
    },
    staleTime: 60_000,
  });

  if (authLoading) return { isAdmin: false, eventIds: [], loading: true };
  if (isAdmin) return { isAdmin: true, eventIds: null, loading: false };
  if (isHoster) return { isAdmin: false, eventIds: q.data ?? [], loading: q.isLoading };
  return { isAdmin: false, eventIds: [], loading: false };
}
