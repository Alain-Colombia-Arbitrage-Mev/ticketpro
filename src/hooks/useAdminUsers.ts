import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../utils/supabase/client";

export type UserRole = "user" | "hoster" | "admin";

export interface AdminUserRow {
  id: string;
  email: string | null;
  name: string | null;
  role: UserRole;
  created_at: string | null;
  updated_at: string | null;
}

export interface AuditLogRow {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

const USERS_KEY = ["admin", "users"] as const;
const AUDIT_KEY = ["admin", "audit_log"] as const;

export interface UserFilters {
  search?: string;
  role?: UserRole | "all";
}

export function useAdminUsers(filters: UserFilters) {
  return useQuery({
    queryKey: [...USERS_KEY, filters],
    queryFn: async (): Promise<AdminUserRow[]> => {
      let q = supabase
        .from("profiles")
        .select("id, email, name, role, created_at, updated_at")
        .order("updated_at", { ascending: false, nullsFirst: false })
        .limit(200);

      if (filters.search?.trim()) {
        const s = filters.search.replace(/[,()]/g, "").trim();
        q = q.or(`email.ilike.%${s}%,name.ilike.%${s}%`);
      }
      if (filters.role && filters.role !== "all") {
        q = q.eq("role", filters.role);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        role: (r.role ?? "user") as UserRole,
      })) as AdminUserRow[];
    },
    staleTime: 15_000,
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { user_id: string; new_role: UserRole; reason?: string }) => {
      const { data, error } = await supabase.functions.invoke("update-user-role", { body: args });
      if (error) {
        const context = (error as unknown as { context?: { response?: Response } }).context;
        if (context?.response) {
          try {
            const j = await context.response.clone().json();
            throw new Error(j?.error || j?.details || error.message);
          } catch {
            // fallthrough
          }
        }
        throw new Error(error.message);
      }
      return data as { ok: boolean; user?: AdminUserRow; previous_role?: UserRole };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_KEY });
      qc.invalidateQueries({ queryKey: AUDIT_KEY });
    },
  });
}

export interface AuditFilters {
  action?: string;
  actorId?: string;
  targetType?: string;
}

export function useAdminAuditLog(filters: AuditFilters, page: number) {
  const PAGE_SIZE = 25;
  return useQuery({
    queryKey: [...AUDIT_KEY, filters, page],
    queryFn: async () => {
      let q = supabase
        .from("admin_audit_log")
        .select(
          "id, actor_id, actor_email, action, target_type, target_id, before_data, after_data, ip_address, created_at",
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (filters.action) q = q.eq("action", filters.action);
      if (filters.actorId) q = q.eq("actor_id", filters.actorId);
      if (filters.targetType) q = q.eq("target_type", filters.targetType);

      const { data, count, error } = await q;
      if (error) throw error;
      return {
        rows: (data ?? []) as AuditLogRow[],
        total: count ?? 0,
        pageSize: PAGE_SIZE,
      };
    },
    staleTime: 10_000,
  });
}
