import { useMemo, useState } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Search,
  Calendar,
  CheckCircle2,
  XCircle,
  Star,
  Flame,
  CircleOff,
  Tag,
  Gift,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAdminEvents,
  useDeleteEvent,
  useToggleEventFlag,
  AdminEventRow,
  EventListFilters,
} from "../../hooks/useAdminEvents";
import { EventFormModal } from "./EventFormModal";
import { IssueCompTicketModal } from "./IssueCompTicketModal";

const CATEGORY_OPTIONS = ["Conferencia", "Concierto", "Deporte", "Festival", "Teatro", "Feria", "Otro"];

export function EventsTab() {
  const [filters, setFilters] = useState<EventListFilters>({ status: "all" });
  const [searchInput, setSearchInput] = useState("");
  const [editing, setEditing] = useState<AdminEventRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [compEventId, setCompEventId] = useState<number | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useAdminEvents(filters);
  const del = useDeleteEvent();
  const toggleFlag = useToggleEventFlag();

  const filtered = useMemo(() => data ?? [], [data]);

  function applySearch() {
    setFilters((f) => ({ ...f, search: searchInput.trim() || undefined }));
  }

  async function handleDelete(e: AdminEventRow) {
    if (!confirm(`¿Eliminar el evento "${e.title}"? Esta acción no se puede deshacer.`)) return;
    try {
      await del.mutateAsync(e.id);
      toast.success("Evento eliminado");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      toast.error(msg);
    }
  }

  async function handleToggle(e: AdminEventRow, flag: "is_active" | "featured" | "trending" | "sold_out") {
    try {
      const current = (e[flag] as boolean | null) ?? false;
      await toggleFlag.mutateAsync({ id: e.id, flag, value: !current });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al actualizar";
      toast.error(msg);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Eventos</h2>
          <p className="text-xs text-white/50">Crea, edita y administra la disponibilidad de eventos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-xs text-white/70 hover:bg-[#222] hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refrescar
          </button>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 rounded-lg bg-[#c61619] px-3 py-2 text-sm font-semibold text-white hover:bg-[#b01217]"
          >
            <Plus className="h-4 w-4" />
            Nuevo evento
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-[#111] p-3 sm:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            onBlur={applySearch}
            placeholder="Título, ubicación, categoría"
            className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#c61619]/50 focus:outline-none"
          />
        </div>
        <select
          value={filters.category ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value || undefined }))}
          className="rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-[#c61619]/50 focus:outline-none [&>option]:bg-[#1a1a1a]"
        >
          <option value="">Todas las categorías</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filters.status ?? "all"}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value as "active" | "inactive" | "all" }))
          }
          className="rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-[#c61619]/50 focus:outline-none [&>option]:bg-[#1a1a1a]"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.from ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value || undefined }))}
            className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-[#c61619]/50 focus:outline-none"
          />
          <span className="text-white/30 text-xs">→</span>
          <input
            type="date"
            value={filters.to ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value || undefined }))}
            className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-[#c61619]/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message={(error as Error)?.message ?? "Error al cargar"} onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState onCreate={() => setCreating(true)} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-[#151515] text-left text-xs uppercase tracking-wider text-white/40">
                  <th className="px-4 py-3 font-medium">Evento</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium text-right">Precio</th>
                  <th className="px-4 py-3 font-medium">Flags</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((e) => (
                  <tr key={e.id} className="bg-[#1a1a1a] hover:bg-[#1e1e1e]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {(e.image_card_url || e.image_url) ? (
                          <img
                            src={e.image_card_url || e.image_url || ""}
                            alt=""
                            loading="lazy"
                            className="h-10 w-10 rounded object-cover bg-[#222]"
                            onError={(ev) => ((ev.target as HTMLImageElement).style.display = "none")}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-[#222]" />
                        )}
                        <div>
                          <div className="font-medium text-white">{e.title}</div>
                          <div className="flex items-center gap-1 text-xs text-white/40">
                            <span>#{e.id}</span>
                            <span>·</span>
                            <span className="truncate max-w-[200px]">{e.location}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-white/40" />
                        {formatDate(e.date)}
                      </div>
                      {e.time && <div className="text-xs text-white/40">{e.time.substring(0, 5)}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#222] px-2 py-0.5 text-xs text-white/70">
                        <Tag className="h-3 w-3" />
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-white">
                      ${Number(e.base_price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <FlagChip
                          on={!!e.is_active}
                          iconOn={<CheckCircle2 className="h-3 w-3" />}
                          iconOff={<XCircle className="h-3 w-3" />}
                          title={e.is_active ? "Activo" : "Inactivo"}
                          colorOn="#22c55e"
                          onClick={() => handleToggle(e, "is_active")}
                        />
                        <FlagChip
                          on={!!e.featured}
                          iconOn={<Star className="h-3 w-3" />}
                          iconOff={<Star className="h-3 w-3" />}
                          title={e.featured ? "Destacado" : "No destacado"}
                          colorOn="#eab308"
                          onClick={() => handleToggle(e, "featured")}
                        />
                        <FlagChip
                          on={!!e.trending}
                          iconOn={<Flame className="h-3 w-3" />}
                          iconOff={<Flame className="h-3 w-3" />}
                          title={e.trending ? "Trending" : "No trending"}
                          colorOn="#f97316"
                          onClick={() => handleToggle(e, "trending")}
                        />
                        <FlagChip
                          on={!!e.sold_out}
                          iconOn={<CircleOff className="h-3 w-3" />}
                          iconOff={<CircleOff className="h-3 w-3" />}
                          title={e.sold_out ? "Agotado" : "Disponible"}
                          colorOn="#ef4444"
                          onClick={() => handleToggle(e, "sold_out")}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setCompEventId(e.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-[#eab308]/10 hover:text-[#facc15]"
                          title="Emitir cortesía"
                        >
                          <Gift className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditing(e)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
                          title="Editar"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(e)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-[#c61619]/10 hover:text-[#f87171]"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-white/10 px-4 py-2 text-xs text-white/40">
            {filtered.length} evento{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {(creating || editing) && (
        <EventFormModal
          event={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {compEventId !== null && (
        <IssueCompTicketModal prefilledEventId={compEventId} onClose={() => setCompEventId(null)} />
      )}
    </div>
  );
}

function FlagChip({
  on,
  iconOn,
  iconOff,
  title,
  colorOn,
  onClick,
}: {
  on: boolean;
  iconOn: React.ReactNode;
  iconOff: React.ReactNode;
  title: string;
  colorOn: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-6 w-6 items-center justify-center rounded transition-colors"
      style={{
        backgroundColor: on ? `${colorOn}20` : "transparent",
        color: on ? colorOn : "rgba(255,255,255,0.25)",
        border: `1px solid ${on ? colorOn + "40" : "rgba(255,255,255,0.08)"}`,
      }}
    >
      {on ? iconOn : iconOff}
    </button>
  );
}

function formatDate(iso: string) {
  if (!iso) return "-";
  const [y, m, d] = iso.substring(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-[#c61619]" />
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-[#111] py-16">
      <AlertTriangle className="h-10 w-10 text-[#c61619]" />
      <p className="max-w-md text-center text-sm text-white/60">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
      >
        <RefreshCw className="h-4 w-4" />
        Reintentar
      </button>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 bg-[#111] py-16">
      <Calendar className="h-10 w-10 text-white/30" />
      <p className="text-sm text-white/60">No hay eventos que coincidan con los filtros</p>
      <button
        onClick={onCreate}
        className="flex items-center gap-2 rounded-lg bg-[#c61619] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b01217]"
      >
        <Plus className="h-4 w-4" />
        Crear primer evento
      </button>
    </div>
  );
}
