import {
  X,
  Loader2,
  CheckCircle2,
  Circle,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  Mail,
  MapPin,
  Calendar,
  Tag,
  Gift,
  DollarSign,
  Ticket as TicketIcon,
  Hash,
  ShieldCheck,
} from "lucide-react";
import {
  useTicketDetail,
  buildLifecycleTimeline,
  LifecycleEvent,
  TicketDetail,
} from "../../hooks/useAdminTickets";

interface Props {
  ticketId: string | null;
  onClose: () => void;
}

export function TicketDetailModal({ ticketId, onClose }: Props) {
  const { data: ticket, isLoading, isError, error } = useTicketDetail(ticketId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-white/10 bg-[#0f0f0f] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0f0f0f] px-6 py-4">
          <div className="flex items-center gap-2">
            <TicketIcon className="h-5 w-5 text-[#c61619]" />
            <div>
              <h2 className="text-lg font-semibold text-white">Detalle de boleta</h2>
              {ticket && <p className="text-xs font-mono text-white/40">{ticket.ticket_code}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#c61619]" />
            </div>
          )}
          {isError && (
            <div className="flex flex-col items-center gap-2 py-16">
              <AlertTriangle className="h-8 w-8 text-[#c61619]" />
              <p className="text-sm text-white/60">{(error as Error)?.message ?? "Error al cargar"}</p>
            </div>
          )}
          {!isLoading && !ticket && !isError && (
            <p className="py-16 text-center text-sm text-white/40">No se encontró la boleta</p>
          )}
          {ticket && <TicketBody t={ticket} />}
        </div>
      </div>
    </div>
  );
}

function TicketBody({ t }: { t: TicketDetail }) {
  const timeline = buildLifecycleTimeline(t);
  return (
    <div className="space-y-6">
      <StatusHeader t={t} />

      <Grid>
        <InfoCard icon={<Calendar className="h-3.5 w-3.5" />} label="Evento">
          <div className="font-medium text-white">{t.event_name || "—"}</div>
          <div className="text-xs text-white/40">
            {t.event_date ? formatDate(t.event_date) : "—"}
            {t.event_time ? ` · ${t.event_time.substring(0, 5)}` : ""}
          </div>
          {t.event_location && (
            <div className="flex items-center gap-1 text-xs text-white/40">
              <MapPin className="h-3 w-3" /> {t.event_location}
            </div>
          )}
        </InfoCard>

        <InfoCard icon={<User className="h-3.5 w-3.5" />} label="Comprador">
          <div className="font-medium text-white">{t.buyer_full_name || "—"}</div>
          <div className="flex items-center gap-1 text-xs text-white/50">
            <Mail className="h-3 w-3" />
            {t.buyer_email}
          </div>
        </InfoCard>

        <InfoCard icon={<DollarSign className="h-3.5 w-3.5" />} label="Precio">
          <div className="font-medium text-white">
            ${Number(t.price ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          {t.is_comp && (
            <div className="inline-flex items-center gap-1 rounded-full bg-[#eab308]/15 px-2 py-0.5 text-xs text-[#facc15]">
              <Gift className="h-3 w-3" /> Cortesía
            </div>
          )}
          {t.price_paid !== null && t.price_paid !== t.price && (
            <div className="text-xs text-white/40">Pagado: ${Number(t.price_paid).toFixed(2)}</div>
          )}
        </InfoCard>

        <InfoCard icon={<Tag className="h-3.5 w-3.5" />} label="Tipo">
          <div className="font-medium text-white">{t.ticket_type || t.ticket_class || "—"}</div>
          {(t.seat_type || t.seat_number) && (
            <div className="text-xs text-white/40">
              {t.seat_type}
              {t.seat_number ? ` · ${t.seat_number}` : ""}
            </div>
          )}
          {t.gate_number && <div className="text-xs text-white/40">Puerta {t.gate_number}</div>}
        </InfoCard>
      </Grid>

      {t.order && (
        <div className="rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-3">
          <div className="flex items-center gap-1 text-xs uppercase tracking-wider text-white/40">
            <Hash className="h-3 w-3" /> Orden
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-mono text-xs text-white/80">{t.order.order_id}</span>
            <span className="text-white/40 text-xs">·</span>
            <span className="text-white/70 text-xs">{t.order.payment_method ?? "—"}</span>
            <span className="text-white/40 text-xs">·</span>
            <span className="text-white/70 text-xs">{t.order.payment_status}</span>
            <span className="text-white/40 text-xs">·</span>
            <span className="text-white/70 text-xs">
              ${Number(t.order.total_amount).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/40">
          <Clock className="h-3 w-3" /> Ciclo de vida
        </h3>
        <ol className="relative ml-3 space-y-4 border-l border-white/10 pl-6">
          {timeline.map((e) => (
            <TimelineItem key={e.key} e={e} />
          ))}
        </ol>
      </div>

      {t.validation_code && (
        <div className="flex items-center gap-2 rounded-lg border border-[#22c55e]/20 bg-[#22c55e]/5 px-4 py-2 text-xs">
          <ShieldCheck className="h-4 w-4 text-[#22c55e]" />
          <span className="text-white/70">Código de validación:</span>
          <span className="font-mono text-[#22c55e]">{t.validation_code}</span>
        </div>
      )}
    </div>
  );
}

function StatusHeader({ t }: { t: TicketDetail }) {
  const color = STATUS_COLOR[t.status] ?? "#6b7280";
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-3">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}20`, color }}
      >
        <TicketIcon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="text-xs text-white/40">Estado actual</div>
        <div className="font-semibold" style={{ color }}>
          {t.status.replace(/_/g, " ")}
        </div>
      </div>
      <div className="text-right text-xs text-white/40">
        Creada {formatDate(t.created_at)}
      </div>
    </div>
  );
}

function TimelineItem({ e }: { e: LifecycleEvent }) {
  const meta = TIMELINE_META[e.status];
  return (
    <li>
      <span
        className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full"
        style={{ backgroundColor: meta.bg, color: meta.color }}
      >
        {meta.icon}
      </span>
      <div className="font-medium text-white">{e.label}</div>
      {e.timestamp && <div className="text-xs text-white/50">{formatDate(e.timestamp)}</div>}
      {e.description && <div className="text-xs text-white/40">{e.description}</div>}
    </li>
  );
}

function InfoCard({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-3">
      <div className="flex items-center gap-1 text-xs uppercase tracking-wider text-white/40">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}

const STATUS_COLOR: Record<string, string> = {
  active: "#22c55e",
  issued_unused: "#3b82f6",
  issued_used: "#a855f7",
  used: "#a855f7",
  expired: "#6b7280",
  cancelled: "#6b7280",
  refunded: "#8b5cf6",
};

const TIMELINE_META: Record<LifecycleEvent["status"], { icon: React.ReactNode; bg: string; color: string }> = {
  done: { icon: <CheckCircle2 className="h-3 w-3" />, bg: "#22c55e20", color: "#22c55e" },
  pending: { icon: <Circle className="h-3 w-3" />, bg: "#ffffff10", color: "#ffffff60" },
  skipped: { icon: <Circle className="h-3 w-3" />, bg: "#6b728030", color: "#9ca3af" },
  failed: { icon: <XCircle className="h-3 w-3" />, bg: "#ef444420", color: "#ef4444" },
};

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
