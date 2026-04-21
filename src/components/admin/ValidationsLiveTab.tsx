import { useMemo, useState } from "react";
import {
  Radio,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  DoorOpen,
  UserCheck,
  Clock,
  Gift,
  Eye,
  Activity,
} from "lucide-react";
import { useAdminEvents } from "../../hooks/useAdminEvents";
import { useAssignedEvents } from "../../hooks/useAssignedEvents";
import {
  useRealtimeValidations,
  computeMetrics,
  ValidationEvent,
} from "../../hooks/useRealtimeValidations";
import { TicketDetailModal } from "./TicketDetailModal";
import { ExportCsvButton } from "./ExportCsvButton";
import { CsvColumn } from "../../utils/exportCsv";
import { supabase } from "../../utils/supabase/client";

export function ValidationsLiveTab() {
  const { isAdmin, eventIds, loading: scopeLoading } = useAssignedEvents();
  const eventsQ = useAdminEvents({ status: "all" });
  const availableEvents = useMemo(() => {
    const all = eventsQ.data ?? [];
    if (isAdmin) return all;
    if (eventIds === null) return all;
    const set = new Set(eventIds);
    return all.filter((e) => set.has(e.id));
  }, [eventsQ.data, isAdmin, eventIds]);

  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { feed, seedLoading, seedError, refetchSeed } = useRealtimeValidations(
    selectedEventId,
  );

  const metrics = useMemo(() => computeMetrics(feed), [feed]);
  const topGates = metrics.gates.slice(0, 5);
  const topValidators = metrics.validators.slice(0, 5);

  // Event capacity (sold tickets for the selected event)
  const scopeLabel = selectedEventId
    ? availableEvents.find((e) => e.id === selectedEventId)?.title ?? `Evento #${selectedEventId}`
    : isAdmin
      ? "Todos los eventos"
      : "Mis eventos asignados";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Radio className="h-5 w-5 text-[#c61619]" />
            Validaciones en vivo
            <LivePulse />
          </h2>
          <p className="text-xs text-white/50">
            Feed en tiempo real de boletas escaneadas · {scopeLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedEventId ?? ""}
            onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : null)}
            className="rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-[#c61619]/50 focus:outline-none [&>option]:bg-[#1a1a1a]"
            disabled={scopeLoading}
          >
            <option value="">
              {isAdmin ? "Todos los eventos" : "Mis eventos asignados"}
            </option>
            {availableEvents.map((e) => (
              <option key={e.id} value={e.id}>
                #{e.id} · {e.title}
              </option>
            ))}
          </select>
          <ExportCsvButton
            filenamePrefix={selectedEventId ? `validaciones-evento-${selectedEventId}` : "validaciones"}
            columns={VALIDATION_CSV_COLUMNS}
            fetchRows={() => fetchAllValidations(selectedEventId)}
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          icon={<ShieldCheck className="h-4 w-4" />}
          label="Validaciones"
          value={metrics.total}
          color="#22c55e"
        />
        <KpiCard
          icon={<DoorOpen className="h-4 w-4" />}
          label="Puertas activas"
          value={metrics.gates.length}
          color="#3b82f6"
        />
        <KpiCard
          icon={<UserCheck className="h-4 w-4" />}
          label="Validadores"
          value={metrics.validators.length}
          color="#a855f7"
        />
        <KpiCard
          icon={<Gift className="h-4 w-4" />}
          label="Cortesías entradas"
          value={feed.filter((f) => f.is_comp).length}
          color="#eab308"
        />
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <MetricCard title="Validaciones por puerta" icon={<DoorOpen className="h-3.5 w-3.5" />}>
          {topGates.length === 0 ? (
            <EmptyRow>Aún no hay validaciones</EmptyRow>
          ) : (
            <ul className="space-y-2">
              {topGates.map((g) => (
                <BarRow key={g.gate} label={g.gate} count={g.count} total={metrics.total} color="#3b82f6" />
              ))}
            </ul>
          )}
        </MetricCard>

        <MetricCard title="Top validadores" icon={<UserCheck className="h-3.5 w-3.5" />}>
          {topValidators.length === 0 ? (
            <EmptyRow>Aún no hay validaciones</EmptyRow>
          ) : (
            <ul className="space-y-2">
              {topValidators.map((v) => (
                <BarRow key={v.name} label={v.name} count={v.count} total={metrics.total} color="#a855f7" />
              ))}
            </ul>
          )}
        </MetricCard>
      </div>

      {/* Feed */}
      <div className="rounded-xl border border-white/10 bg-[#111]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/40">
            <Activity className="h-3.5 w-3.5" />
            Feed de validaciones
          </div>
          <button
            onClick={() => refetchSeed()}
            className="text-xs text-white/50 hover:text-white"
          >
            Recargar histórico
          </button>
        </div>

        {seedLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#c61619]" />
          </div>
        ) : seedError ? (
          <div className="flex flex-col items-center gap-2 py-12">
            <AlertTriangle className="h-8 w-8 text-[#c61619]" />
            <p className="text-sm text-white/60">{seedError.message}</p>
          </div>
        ) : feed.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Radio className="h-10 w-10 text-white/30" />
            <p className="text-sm text-white/60">Esperando validaciones...</p>
            <p className="text-xs text-white/40">Cuando un hoster escanee un QR, aparecerá aquí al instante</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {feed.map((f, idx) => (
              <FeedRow key={f.id} f={f} isNew={idx === 0} onClick={() => setDetailId(f.id)} />
            ))}
          </ul>
        )}
      </div>

      {detailId && <TicketDetailModal ticketId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/50">{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{value.toLocaleString()}</p>
    </div>
  );
}

function MetricCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111] p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/40">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function BarRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <li className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="truncate max-w-[70%] text-white/80">{label}</span>
        <span className="text-white/60 font-medium">{count}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </li>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-white/40">{children}</p>;
}

function FeedRow({
  f,
  isNew,
  onClick,
}: {
  f: ValidationEvent;
  isNew: boolean;
  onClick: () => void;
}) {
  return (
    <li
      className={`flex items-center gap-3 px-4 py-3 transition-all ${isNew ? "bg-[#22c55e]/5" : ""}`}
      style={isNew ? { animation: "slideInLeft 0.5s ease-out" } : undefined}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#22c55e]/15 text-[#22c55e]">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-white/80">{f.ticket_code}</span>
          {f.is_comp && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#eab308]/15 px-1.5 py-0.5 text-[10px] text-[#facc15]">
              <Gift className="h-2.5 w-2.5" /> comp
            </span>
          )}
          {f.gate_number && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#3b82f6]/15 px-1.5 py-0.5 text-[10px] text-[#60a5fa]">
              <DoorOpen className="h-2.5 w-2.5" /> {f.gate_number}
            </span>
          )}
        </div>
        <div className="text-xs text-white/50 truncate">
          {f.buyer_full_name || f.buyer_email} · {f.event_name}
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1 text-xs text-white/60">
          <Clock className="h-3 w-3" />
          {formatTime(f.used_at)}
        </div>
        {f.used_by_name && <div className="text-[10px] text-white/40 truncate max-w-[140px]">{f.used_by_name}</div>}
      </div>
      <button
        onClick={onClick}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-white/5 hover:text-white"
        title="Ver detalle"
      >
        <Eye className="h-4 w-4" />
      </button>

      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </li>
  );
}

function LivePulse() {
  return (
    <span className="relative inline-flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e]" />
    </span>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

// ─── CSV export ──────────────────────────────────────────────────────────────

interface ValidationCsvRow {
  ticket_code: string;
  event_name: string | null;
  event_id: number | null;
  buyer_full_name: string | null;
  buyer_email: string;
  used_at: string;
  used_by_name: string | null;
  gate_number: string | null;
  validation_code: string | null;
  is_comp: boolean | null;
}

const VALIDATION_CSV_COLUMNS: CsvColumn<ValidationCsvRow>[] = [
  { key: "used_at", header: "Validada en", get: (r) => r.used_at },
  { key: "ticket_code", header: "Código boleta", get: (r) => r.ticket_code },
  { key: "event_id", header: "Evento ID", get: (r) => r.event_id ?? "" },
  { key: "event_name", header: "Evento", get: (r) => r.event_name ?? "" },
  { key: "buyer_full_name", header: "Asistente", get: (r) => r.buyer_full_name ?? "" },
  { key: "buyer_email", header: "Email", get: (r) => r.buyer_email },
  { key: "gate_number", header: "Puerta", get: (r) => r.gate_number ?? "" },
  { key: "used_by_name", header: "Validada por", get: (r) => r.used_by_name ?? "" },
  { key: "validation_code", header: "Código validación", get: (r) => r.validation_code ?? "" },
  { key: "is_comp", header: "Cortesía", get: (r) => (r.is_comp ? "sí" : "no") },
];

async function fetchAllValidations(eventId: number | null): Promise<ValidationCsvRow[]> {
  let q = supabase
    .from("tickets")
    .select(
      "ticket_code, event_name, event_id, buyer_full_name, buyer_email, used_at, used_by, gate_number, validation_code, is_comp",
    )
    .not("used_at", "is", null)
    .order("used_at", { ascending: false })
    .limit(10_000);
  if (eventId) q = q.eq("event_id", eventId);

  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as (ValidationCsvRow & { used_by: string | null })[];

  const ids = [...new Set(rows.map((r) => r.used_by).filter(Boolean))] as string[];
  const nameById = new Map<string, string>();
  if (ids.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", ids);
    profs?.forEach((p) => nameById.set(p.id, p.name || p.email || p.id));
  }

  return rows.map((r) => ({
    ticket_code: r.ticket_code,
    event_name: r.event_name,
    event_id: r.event_id,
    buyer_full_name: r.buyer_full_name,
    buyer_email: r.buyer_email,
    used_at: r.used_at,
    used_by_name: r.used_by ? nameById.get(r.used_by) ?? r.used_by : null,
    gate_number: r.gate_number,
    validation_code: r.validation_code,
    is_comp: r.is_comp,
  }));
}
