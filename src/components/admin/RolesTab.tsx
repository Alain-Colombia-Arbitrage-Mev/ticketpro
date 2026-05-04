import { useState } from "react";
import {
  Search,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Users,
  Shield,
  UserCog,
  User,
  History,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  KeyRound,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAdminUsers,
  useUpdateUserRole,
  useAdminAuditLog,
  useDeleteUser,
  useCreateUser,
  useResetUserPassword,
  AdminUserRow,
  AuditLogRow,
  UserRole,
  UserFilters,
} from "../../hooks/useAdminUsers";
import { useAuth } from "../../hooks/useAuth";
import { ExportCsvButton } from "./ExportCsvButton";
import { CsvColumn } from "../../utils/exportCsv";
import { supabase } from "../../utils/supabase/client";
import { AddUserModal } from "./AddUserModal";

const ROLE_META: Record<UserRole, { label: string; color: string; icon: React.ElementType }> = {
  admin: { label: "Admin", color: "#c61619", icon: Shield },
  hoster: { label: "Hoster", color: "#3b82f6", icon: UserCog },
  user: { label: "Usuario", color: "#6b7280", icon: User },
};

export function RolesTab() {
  const { user: current } = useAuth();
  const [filters, setFilters] = useState<UserFilters>({ role: "all" });
  const [searchInput, setSearchInput] = useState("");
  const [view, setView] = useState<"users" | "audit">("users");
  const [inviteOpen, setInviteOpen] = useState(false);
  const isAdmin = current?.role === "admin";

  const usersQ = useAdminUsers(filters);
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();
  const resetPwd = useResetUserPassword();

  function applySearch() {
    setFilters((f) => ({ ...f, search: searchInput.trim() || undefined }));
  }

  async function handleChangeRole(user: AdminUserRow, newRole: UserRole) {
    if (user.role === newRole) return;
    const target = user.name || user.email || user.id.substring(0, 8);
    const confirmMsg =
      newRole === "admin"
        ? `¿Promover a ${target} a ADMIN? Tendrá acceso total al panel.`
        : `¿Cambiar rol de ${target} de "${user.role}" a "${newRole}"?`;
    if (!confirm(confirmMsg)) return;

    try {
      await updateRole.mutateAsync({ user_id: user.id, new_role: newRole });
      toast.success(`Rol actualizado a ${newRole}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cambiar rol";
      toast.error(msg);
    }
  }

  async function handleDelete(user: AdminUserRow) {
    const target = user.name || user.email || user.id.substring(0, 8);
    if (!confirm(
      `¿Eliminar usuario "${target}" permanentemente?\n\nEsto borra la cuenta de auth y su profile. No se puede deshacer.`
    )) return;
    try {
      await deleteUser.mutateAsync(user.id);
      toast.success("Usuario eliminado");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      toast.error(msg);
    }
  }

  async function handleResetPassword(user: AdminUserRow) {
    if (!user.email) {
      toast.error("Usuario sin email, no se puede resetear contraseña");
      return;
    }
    if (!confirm(
      `¿Generar una nueva contraseña para ${user.email}?\n\nSe te va a mostrar una sola vez — copiala y compartila con el usuario.`
    )) return;
    try {
      const res = await resetPwd.mutateAsync(user.id);
      if (res.generatedPassword) {
        // Show in a sticky toast with the password for copying.
        toast.success(
          `Nueva contraseña para ${user.email}: ${res.generatedPassword}`,
          {
            duration: 60_000,
            action: {
              label: "Copiar",
              onClick: () => {
                navigator.clipboard.writeText(res.generatedPassword!);
                toast.info("Copiada al portapapeles");
              },
            },
          }
        );
      } else {
        toast.success("Contraseña reseteada");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al resetear contraseña";
      toast.error(msg);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header + view switch */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Roles y usuarios</h2>
          <p className="text-xs text-white/50">
            Invitá nuevos admins/hosters, promové cuentas existentes · todo queda en audit log
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && view === "users" && (
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-[#c61619] px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-[#c61619]/20 hover:bg-[#b01217]"
            >
              <UserPlus className="h-4 w-4" />
              Añadir usuario
            </button>
          )}
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#111] p-1">
            <ViewTab
              active={view === "users"}
              label="Usuarios"
              icon={<Users className="h-3.5 w-3.5" />}
              onClick={() => setView("users")}
            />
            <ViewTab
              active={view === "audit"}
              label="Audit log"
              icon={<History className="h-3.5 w-3.5" />}
              onClick={() => setView("audit")}
            />
          </div>
        </div>
      </div>

      {inviteOpen && <AddUserModal onClose={() => setInviteOpen(false)} />}

      {view === "users" ? (
        <>
          {/* Filters */}
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-[#111] p-3 sm:grid-cols-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applySearch()}
                onBlur={applySearch}
                placeholder="Buscar por email o nombre"
                className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#c61619]/50 focus:outline-none"
              />
            </div>
            <select
              value={filters.role ?? "all"}
              onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value as UserRole | "all" }))}
              className="rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-[#c61619]/50 focus:outline-none [&>option]:bg-[#1a1a1a]"
            >
              <option value="all">Todos los roles</option>
              <option value="admin">Admin</option>
              <option value="hoster">Hoster</option>
              <option value="user">Usuario</option>
            </select>
          </div>

          {/* Users table */}
          <UsersTable
            query={usersQ}
            currentUserId={current?.id}
            pending={updateRole.isPending || deleteUser.isPending || resetPwd.isPending}
            canManage={isAdmin}
            onChangeRole={handleChangeRole}
            onDelete={handleDelete}
            onResetPassword={handleResetPassword}
          />
        </>
      ) : (
        <AuditLogView />
      )}
    </div>
  );
}

function ViewTab({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-[#c61619] text-white shadow"
          : "text-white/60 hover:bg-white/5 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function UsersTable({
  query,
  currentUserId,
  pending,
  canManage,
  onChangeRole,
  onDelete,
  onResetPassword,
}: {
  query: ReturnType<typeof useAdminUsers>;
  currentUserId?: string;
  pending: boolean;
  canManage: boolean;
  onChangeRole: (u: AdminUserRow, r: UserRole) => void;
  onDelete: (u: AdminUserRow) => void;
  onResetPassword: (u: AdminUserRow) => void;
}) {
  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#c61619]" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-[#111] py-16">
        <AlertTriangle className="h-10 w-10 text-[#c61619]" />
        <p className="text-sm text-white/60">{(query.error as Error)?.message}</p>
        <button
          onClick={() => query.refetch()}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
        >
          <RefreshCw className="h-4 w-4" /> Reintentar
        </button>
      </div>
    );
  }
  const rows = query.data ?? [];
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 bg-[#111] py-16">
        <Users className="h-10 w-10 text-white/30" />
        <p className="text-sm text-white/60">No hay usuarios con estos filtros</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-[#151515] text-left text-xs uppercase tracking-wider text-white/40">
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Rol actual</th>
              <th className="px-4 py-3 font-medium hidden lg:table-cell">Actualizado</th>
              <th className="px-4 py-3 font-medium text-right">Cambiar rol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((u) => {
              const meta = ROLE_META[u.role];
              const Icon = meta.icon;
              const isSelf = u.id === currentUserId;
              return (
                <tr key={u.id} className="bg-[#1a1a1a] hover:bg-[#1e1e1e]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold uppercase"
                        style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                      >
                        {(u.name || u.email || "?").substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 text-white truncate">
                          {u.name || "—"}
                          {isSelf && (
                            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">
                              tú
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-white/40 truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${meta.color}20`,
                        color: meta.color,
                        border: `1px solid ${meta.color}40`,
                      }}
                    >
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40 hidden lg:table-cell">
                    {u.updated_at ? new Date(u.updated_at).toLocaleString("es-MX") : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1 flex-wrap justify-end">
                      {(["user", "hoster", "admin"] as UserRole[])
                        .filter((r) => r !== u.role)
                        .map((r) => {
                          const m = ROLE_META[r];
                          const R = m.icon;
                          return (
                            <button
                              key={r}
                              onClick={() => onChangeRole(u, r)}
                              disabled={pending}
                              className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-white/70 hover:text-white disabled:opacity-50"
                              style={{ borderColor: `${m.color}30` }}
                              title={`Cambiar a ${m.label}`}
                            >
                              <R className="h-3 w-3" style={{ color: m.color }} />
                              {m.label}
                            </button>
                          );
                        })}
                      {canManage && !isSelf && (
                        <>
                          <span className="mx-0.5 h-4 w-px bg-white/10" aria-hidden="true" />
                          <button
                            onClick={() => onResetPassword(u)}
                            disabled={pending}
                            className="flex items-center gap-1 rounded-lg border border-amber-500/20 px-2 py-1 text-xs text-amber-300/80 hover:bg-amber-500/10 hover:text-amber-200 disabled:opacity-50"
                            title="Generar nueva contraseña"
                          >
                            <KeyRound className="h-3 w-3" />
                            <span className="hidden xl:inline">Reset clave</span>
                          </button>
                          <button
                            onClick={() => onDelete(u)}
                            disabled={pending}
                            className="flex items-center gap-1 rounded-lg border border-[#c61619]/30 px-2 py-1 text-xs text-[#ff5a5d] hover:bg-[#c61619]/10 disabled:opacity-50"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="hidden xl:inline">Eliminar</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-white/10 px-4 py-2 text-xs text-white/40">
        {rows.length} usuario{rows.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

function AuditLogView() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>("");
  const q = useAdminAuditLog(actionFilter ? { action: actionFilter } : {}, page);

  const totalPages = Math.max(1, Math.ceil((q.data?.total ?? 0) / (q.data?.pageSize ?? 25)));

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#111] p-3 sm:flex-row sm:items-center">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-[#c61619]/50 focus:outline-none [&>option]:bg-[#1a1a1a]"
        >
          <option value="">Todas las acciones</option>
          <option value="role.update">Cambios de rol</option>
          <option value="ticket.issue_comp">Emisión de cortesías</option>
        </select>
        <button
          onClick={() => q.refetch()}
          disabled={q.isFetching}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-xs text-white/70 hover:bg-[#222] hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${q.isFetching ? "animate-spin" : ""}`} />
          Refrescar
        </button>
        <ExportCsvButton
          filenamePrefix="audit-log"
          columns={AUDIT_CSV_COLUMNS}
          fetchRows={() => fetchAllAuditRows(actionFilter)}
        />
      </div>

      {q.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#c61619]" />
        </div>
      ) : q.isError ? (
        <div className="flex flex-col items-center gap-2 py-16">
          <AlertTriangle className="h-8 w-8 text-[#c61619]" />
          <p className="text-sm text-white/60">{(q.error as Error)?.message}</p>
        </div>
      ) : (q.data?.rows.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 bg-[#111] py-16">
          <History className="h-10 w-10 text-white/30" />
          <p className="text-sm text-white/60">Sin registros de auditoría</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-[#151515] text-left text-xs uppercase tracking-wider text-white/40">
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Acción</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Objetivo</th>
                  <th className="px-4 py-3 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {q.data!.rows.map((r) => (
                  <AuditRow key={r.id} r={r} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-xs">
            <span className="text-white/40">{q.data?.total ?? 0} registros</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-white/60">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const AUDIT_CSV_COLUMNS: CsvColumn<AuditLogRow>[] = [
  { key: "created_at", header: "Fecha", get: (r) => r.created_at },
  { key: "action", header: "Acción", get: (r) => r.action },
  { key: "actor_email", header: "Actor", get: (r) => r.actor_email ?? r.actor_id ?? "" },
  { key: "target_type", header: "Tipo objetivo", get: (r) => r.target_type ?? "" },
  { key: "target_id", header: "ID objetivo", get: (r) => r.target_id ?? "" },
  { key: "before", header: "Antes", get: (r) => (r.before_data ? JSON.stringify(r.before_data) : "") },
  { key: "after", header: "Después", get: (r) => (r.after_data ? JSON.stringify(r.after_data) : "") },
  { key: "ip", header: "IP", get: (r) => r.ip_address ?? "" },
];

async function fetchAllAuditRows(action: string): Promise<AuditLogRow[]> {
  let q = supabase
    .from("admin_audit_log")
    .select(
      "id, actor_id, actor_email, action, target_type, target_id, before_data, after_data, ip_address, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(10_000);
  if (action) q = q.eq("action", action);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AuditLogRow[];
}

function AuditRow({ r }: { r: AuditLogRow }) {
  let summary = "";
  if (r.action === "role.update") {
    const oldRole = (r.before_data as Record<string, unknown>)?.role ?? "?";
    const newRole = (r.after_data as Record<string, unknown>)?.role ?? "?";
    summary = `${oldRole} → ${newRole}`;
  } else if (r.action === "ticket.issue_comp") {
    const q = (r.after_data as Record<string, unknown>)?.quantity ?? 1;
    const reason = (r.after_data as Record<string, unknown>)?.issue_reason ?? "";
    summary = `${q} cortesía${Number(q) !== 1 ? "s" : ""} · ${reason}`;
  } else {
    summary = "—";
  }

  return (
    <tr className="bg-[#1a1a1a] hover:bg-[#1e1e1e]">
      <td className="px-4 py-3 text-xs text-white/60 whitespace-nowrap">
        {new Date(r.created_at).toLocaleString("es-MX", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex rounded-full bg-white/5 px-2 py-0.5 font-mono text-xs text-white/80">
          {r.action}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-white/70 truncate max-w-[200px]">
        {r.actor_email ?? r.actor_id ?? "—"}
      </td>
      <td className="px-4 py-3 text-xs text-white/70">
        {r.target_type && (
          <span className="text-white/40">{r.target_type}:</span>
        )}{" "}
        <span className="font-mono text-xs">{r.target_id?.substring(0, 12) ?? "—"}</span>
      </td>
      <td className="px-4 py-3 text-xs text-white/70">{summary}</td>
    </tr>
  );
}
