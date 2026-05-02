import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Ticket as TicketIcon,
  Gift,
  Eye,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAdminTickets,
  useTicketStatusBreakdown,
  AdminTicketsFilters,
  TICKETS_PAGE_SIZE,
  AdminTicketRow,
} from "../../hooks/useAdminTickets";
import { useAdminEvents } from "../../hooks/useAdminEvents";
import { TicketDetailModal } from "./TicketDetailModal";
import { IssueCompTicketModal } from "./IssueCompTicketModal";
import { ExportCsvButton } from "./ExportCsvButton";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../utils/supabase/client";
import { CsvColumn } from "../../utils/exportCsv";
import { useResendSelectedTickets } from "../../hooks/useResendSelectedTickets";

const STATUSES = [
  "active",
  "issued_unused",
  "issued_used",
  "used",
  "expired",
  "cancelled",
  "refunded",
] as const;

const STATUS_COLOR: Record<string, string> = {
  active: "#22c55e",
  issued_unused: "#3b82f6",
  issued_used: "#a855f7",
  used: "#a855f7",
  expired: "#6b7280",
  cancelled: "#6b7280",
  refunded: "#8b5cf6",
};

export function TicketsAdminTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [filters, setFilters] = useState<AdminTicketsFilters>({});
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showCompModal, setShowCompModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const resendTickets = useResendSelectedTickets();

  const eventsQ = useAdminEvents({ status: "all" });
  const breakdownQ = useTicketStatusBreakdown(filters.eventId ?? null);
  const ticketsQ = useAdminTickets(filters, page);

  const eventOptions = useMemo(() => {
    const evs = eventsQ.data ?? [];
    return [...evs].sort((a, b) => (a.title > b.title ? 1 : -1));
  }, [eventsQ.data]);

  const totalPages = Math.max(1, Math.ceil((ticketsQ.data?.total ?? 0) / TICKETS_PAGE_SIZE));
  const rows = ticketsQ.data?.rows ?? [];
  const pageIds = rows.map((r) => r.id);
  const selectedOnPage = pageIds.filter((id) => selectedIds.has(id));
  const allPageSelected = pageIds.length > 0 && selectedOnPage.length === pageIds.length;

  useEffect(() => {
    setSelectedIds(new Set());
  }, [filters, page]);

  function updateFilter<K extends keyof AdminTicketsFilters>(k: K, v: AdminTicketsFilters[K]) {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
  }

  function applySearch() {
    updateFilter("search", searchInput.trim() || undefined);
  }

  function toggleTicket(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  async function handleResend(ticketIds: string[]) {
    if (ticketIds.length === 0) return;
    const confirmed = window.confirm(
      `Reenviar ${ticketIds.length} boleta${ticketIds.length !== 1 ? "s" : ""} a sus comprador${ticketIds.length !== 1 ? "es" : ""}?`,
    );
    if (!confirmed) return;

    try {
      setSendingIds(new Set(ticketIds));
      const res = await resendTickets.mutateAsync({ ticket_ids: ticketIds });
      toast.success(
        `${res.sent_count} boleta${res.sent_count !== 1 ? "s" : ""} enviada${res.sent_count !== 1 ? "s" : ""} a ${res.recipient_count} destinatario${res.recipient_count !== 1 ? "s" : ""}`,
      );
      setSelectedIds((current) => {
        const next = new Set(current);
        ticketIds.forEach((id) => next.delete(id));
        return next;
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron reenviar las boletas");
    } finally {
      setSendingIds(new Set());
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Boletas</h2>
          <p className="text-xs text-white/50">Busca, filtra por evento/estado y abre el detalle con ciclo de vida</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && selectedIds.size > 0 && (
            <button
              onClick={() => handleResend([...selectedIds])}
              disabled={resendTickets.isPending}
              className="flex items-center gap-2 rounded-lg bg-[#c61619] px-3 py-2 text-xs font-semibold text-white hover:bg-[#b01217] disabled:opacity-50"
            >
              {resendTickets.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
              Reenviar {selectedIds.size}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowCompModal(true)}
              className="flex items-center gap-2 rounded-lg bg-[#eab308] px-3 py-2 text-xs font-semibold text-[#1a1a1a] hover:bg-[#ca9b09]"
            >
              <Gift className="h-3.5 w-3.5" />
              Emitir cortesía
            </button>
          )}
          <ExportCsvButton
            filenamePrefix="boletas"
            columns={TICKET_CSV_COLUMNS}
            fetchRows={() => fetchAllTickets(filters)}
          />
          <button
            onClick={() => {
              ticketsQ.refetch();
              breakdownQ.refetch();
            }}
            disabled={ticketsQ.isFetching}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-xs text-white/70 hover:bg-[#222] hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${ticketsQ.isFetching ? "animate-spin" : ""}`} />
            Refrescar
          </button>
        </div>
      </div>

      {/* Status breakdown cards */}
      <StatusBreakdown
        data={breakdownQ.data ?? []}
        loading={breakdownQ.isLoading}
        scopeLabel={
          filters.eventId
            ? eventOptions.find((e) => e.id === filters.eventId)?.title ?? "Evento seleccionado"
            : "Todos los eventos"
        }
        activeStatus={filters.status}
        onClickStatus={(s) => updateFilter("status", filters.status === s ? undefined : s)}
      />

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-[#111] p-3 sm:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            onBlur={applySearch}
            placeholder="Código de boleta, email o nombre del comprador"
            className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#c61619]/50 focus:outline-none"
          />
        </div>

        <select
          value={filters.eventId ?? ""}
          onChange={(e) => updateFilter("eventId", e.target.value ? Number(e.target.value) : null)}
          className="rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-[#c61619]/50 focus:outline-none [&>option]:bg-[#1a1a1a]"
        >
          <option value="">Todos los eventos</option>
          {eventOptions.map((e) => (
            <option key={e.id} value={e.id}>
              #{e.id} · {e.title}
            </option>
          ))}
        </select>

        <select
          value={filters.isComp === undefined ? "" : filters.isComp ? "comp" : "paid"}
          onChange={(e) =>
            updateFilter(
              "isComp",
              e.target.value === "" ? undefined : e.target.value === "comp",
            )
          }
          className="rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-[#c61619]/50 focus:outline-none [&>option]:bg-[#1a1a1a]"
        >
          <option value="">Todas (pago + cortesía)</option>
          <option value="paid">Solo pagadas</option>
          <option value="comp">Solo cortesías</option>
        </select>
      </div>

      {/* Results */}
      {ticketsQ.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#c61619]" />
        </div>
      ) : ticketsQ.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-[#111] py-16">
          <AlertTriangle className="h-10 w-10 text-[#c61619]" />
          <p className="text-sm text-white/60">{(ticketsQ.error as Error)?.message ?? "Error al cargar"}</p>
          <button
            onClick={() => ticketsQ.refetch()}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" /> Reintentar
          </button>
        </div>
      ) : (ticketsQ.data?.rows.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 bg-[#111] py-16">
          <TicketIcon className="h-10 w-10 text-white/30" />
          <p className="text-sm text-white/60">No hay boletas con estos filtros</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-[#151515] text-left text-xs uppercase tracking-wider text-white/40">
                  {isAdmin && (
                    <th className="w-10 px-4 py-3 font-medium">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={togglePage}
                        aria-label="Seleccionar boletas de esta pagina"
                        className="h-4 w-4 rounded border-white/20 bg-[#111] accent-[#c61619]"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Evento</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Comprador</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">Precio</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Creada</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((r) => (
                  <tr key={r.id} className="bg-[#1a1a1a] hover:bg-[#1e1e1e]">
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(r.id)}
                          onChange={() => toggleTicket(r.id)}
                          aria-label={`Seleccionar boleta ${r.ticket_code}`}
                          className="h-4 w-4 rounded border-white/20 bg-[#111] accent-[#c61619]"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-white/80">{r.ticket_code}</div>
                      {r.is_comp && (
                        <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-[#eab308]/15 px-1.5 py-0.5 text-[10px] text-[#facc15]">
                          <Gift className="h-2.5 w-2.5" /> Cortesía
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/70 max-w-[200px] truncate">{r.event_name}</td>
                    <td className="px-4 py-3 text-white/60 hidden md:table-cell">
                      <div className="truncate max-w-[200px]">{r.buyer_full_name}</div>
                      <div className="text-xs text-white/40 truncate max-w-[200px]">{r.buyer_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-white">
                      ${Number(r.price ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs hidden lg:table-cell">
                      {formatShort(r.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        {isAdmin && (
                          <button
                            onClick={() => handleResend([r.id])}
                            disabled={resendTickets.isPending}
                            className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-50"
                            title="Reenviar esta boleta al comprador"
                          >
                            {sendingIds.has(r.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                            Reenviar
                          </button>
                        )}
                        <button
                          onClick={() => setDetailId(r.id)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-white/60 hover:bg-white/10 hover:text-white"
                        >
                          <Eye className="h-3.5 w-3.5" /> Detalle
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-xs">
            <span className="text-white/40">
              {ticketsQ.data?.total ?? 0} boleta{(ticketsQ.data?.total ?? 0) !== 1 ? "s" : ""}
            </span>
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

      {detailId && <TicketDetailModal ticketId={detailId} onClose={() => setDetailId(null)} />}
      {showCompModal && (
        <IssueCompTicketModal
          prefilledEventId={filters.eventId ?? null}
          onClose={() => setShowCompModal(false)}
        />
      )}
    </div>
  );
}

function StatusBreakdown({
  data,
  loading,
  scopeLabel,
  activeStatus,
  onClickStatus,
}: {
  data: { status: string; count: number }[];
  loading: boolean;
  scopeLabel: string;
  activeStatus?: string;
  onClickStatus: (s: string) => void;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#111] p-4">
        <Loader2 className="h-4 w-4 animate-spin text-white/40" />
      </div>
    );
  }
  const total = data.reduce((s, d) => s + d.count, 0);
  const orderedStatuses = [
    ...STATUSES.filter((s) => data.some((d) => d.status === s)),
    ...data.map((d) => d.status).filter((s) => !STATUSES.includes(s as (typeof STATUSES)[number])),
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-[#111] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-white/40">Resumen por estado</div>
        <div className="text-xs text-white/50 truncate max-w-[60%]">{scopeLabel}</div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        <BreakdownCard label="Total" count={total} color="#c61619" active={!activeStatus} onClick={() => onClickStatus(activeStatus ?? "")} />
        {orderedStatuses.map((s) => {
          const d = data.find((x) => x.status === s)!;
          return (
            <BreakdownCard
              key={s}
              label={s.replace(/_/g, " ")}
              count={d.count}
              color={STATUS_COLOR[s] ?? "#6b7280"}
              active={activeStatus === s}
              onClick={() => onClickStatus(s)}
            />
          );
        })}
      </div>
    </div>
  );
}

function BreakdownCard({
  label,
  count,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-all hover:bg-white/5"
      style={{
        backgroundColor: active ? `${color}15` : "#1a1a1a",
        borderColor: active ? `${color}60` : "rgba(255,255,255,0.08)",
      }}
    >
      <span className="text-xs text-white/50 capitalize">{label}</span>
      <span className="text-lg font-bold" style={{ color }}>
        {count.toLocaleString()}
      </span>
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? "#6b7280";
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `${color}20`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function formatShort(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", { month: "short", day: "numeric", year: "2-digit" });
}

// ─── CSV export ──────────────────────────────────────────────────────────────

const TICKET_CSV_COLUMNS: CsvColumn<AdminTicketRow>[] = [
  { key: "ticket_code", header: "Código", get: (r) => r.ticket_code },
  { key: "status", header: "Estado", get: (r) => r.status },
  { key: "is_comp", header: "Cortesía", get: (r) => (r.is_comp ? "sí" : "no") },
  { key: "event_id", header: "Evento ID", get: (r) => r.event_id ?? "" },
  { key: "event_name", header: "Evento", get: (r) => r.event_name ?? "" },
  { key: "event_date", header: "Fecha evento", get: (r) => r.event_date ?? "" },
  { key: "buyer_full_name", header: "Comprador", get: (r) => r.buyer_full_name ?? "" },
  { key: "buyer_email", header: "Email", get: (r) => r.buyer_email },
  { key: "price", header: "Precio", get: (r) => Number(r.price ?? 0).toFixed(2) },
  { key: "ticket_type", header: "Tipo", get: (r) => r.ticket_type ?? "" },
  { key: "seat_type", header: "Asiento", get: (r) => r.seat_type ?? "" },
  { key: "gate_number", header: "Puerta", get: (r) => r.gate_number ?? "" },
  { key: "used_at", header: "Validada en", get: (r) => r.used_at ?? "" },
  { key: "validation_code", header: "Cód. validación", get: (r) => r.validation_code ?? "" },
  { key: "created_at", header: "Creada", get: (r) => r.created_at },
];

async function fetchAllTickets(filters: AdminTicketsFilters): Promise<AdminTicketRow[]> {
  let q = supabase
    .from("tickets")
    .select(
      "id, ticket_code, qr_code, event_id, event_name, event_date, event_time, event_location, buyer_id, buyer_email, buyer_full_name, status, price, price_paid, is_comp, issued_by, issue_reason, used_at, used_by, validation_code, gate_number, seat_number, seat_type, ticket_type, ticket_class, order_uuid, purchase_date, metadata, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(10_000);

  if (filters.search?.trim()) {
    const s = filters.search.replace(/[,()]/g, "").trim();
    q = q.or(`ticket_code.ilike.%${s}%,buyer_email.ilike.%${s}%,buyer_full_name.ilike.%${s}%`);
  }
  if (filters.eventId) q = q.eq("event_id", filters.eventId);
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.isComp !== undefined) q = q.eq("is_comp", filters.isComp);
  if (filters.from) q = q.gte("created_at", filters.from);
  if (filters.to) q = q.lte("created_at", filters.to);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AdminTicketRow[];
}
