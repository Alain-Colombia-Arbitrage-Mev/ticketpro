import { useEffect, useState } from "react";
import { X, Loader2, Gift, Mail, User, FileText, Hash, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { useAdminEvents } from "../../hooks/useAdminEvents";
import { useIssueCompTicket, IssueCompTicketInput } from "../../hooks/useIssueCompTicket";

interface Props {
  prefilledEventId?: number | null;
  onClose: () => void;
}

const COMMON_REASONS = ["Staff", "Prensa", "Invitado VIP", "Patrocinador", "Cortesía general"];
const COMMON_TYPES = ["Cortesía", "Staff", "VIP", "Prensa"];

export function IssueCompTicketModal({ prefilledEventId, onClose }: Props) {
  const eventsQ = useAdminEvents({ status: "active" });
  const issue = useIssueCompTicket();

  const [form, setForm] = useState<IssueCompTicketInput>({
    event_id: prefilledEventId ?? 0,
    buyer_email: "",
    buyer_full_name: "",
    issue_reason: "",
    quantity: 1,
    ticket_type: "Cortesía",
    seat_type: null,
    gate_number: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ id: string; ticket_code: string }[] | null>(null);

  useEffect(() => {
    if (prefilledEventId) setForm((f) => ({ ...f, event_id: prefilledEventId }));
  }, [prefilledEventId]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.event_id) next.event_id = "Selecciona un evento";
    if (!form.buyer_email.trim()) next.buyer_email = "Requerido";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.buyer_email.trim()))
      next.buyer_email = "Email inválido";
    if (!form.buyer_full_name.trim()) next.buyer_full_name = "Requerido";
    if (!form.issue_reason.trim()) next.issue_reason = "Motivo requerido";
    if (form.quantity < 1) next.quantity = "Mínimo 1";
    if (form.quantity > 20) next.quantity = "Máximo 20";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    try {
      const res = await issue.mutateAsync({
        ...form,
        buyer_email: form.buyer_email.trim().toLowerCase(),
        buyer_full_name: form.buyer_full_name.trim(),
        issue_reason: form.issue_reason.trim(),
      });
      setResult(res.tickets);
      toast.success(`${res.count} cortesía${res.count !== 1 ? "s" : ""} emitida${res.count !== 1 ? "s" : ""}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al emitir";
      toast.error(msg);
    }
  }

  function copyCodes() {
    if (!result) return;
    const text = result.map((t) => t.ticket_code).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Códigos copiados");
  }

  const eventOptions = (eventsQ.data ?? []).filter((e) => e.is_active);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-white/10 bg-[#0f0f0f] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0f0f0f] px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eab308]/15 text-[#facc15]">
              <Gift className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Emitir cortesía</h2>
              <p className="text-xs text-white/50">Boleta gratuita sin pago. Queda registrada en audit log.</p>
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

        {result ? (
          <SuccessView tickets={result} onCopy={copyCodes} onClose={onClose} onIssueAnother={() => setResult(null)} />
        ) : (
          <div className="space-y-4 px-6 py-5">
            <Field label="Evento" error={errors.event_id}>
              <select
                value={form.event_id || ""}
                onChange={(e) => setForm({ ...form, event_id: Number(e.target.value) })}
                className="inp [&>option]:bg-[#1a1a1a]"
                disabled={eventsQ.isLoading}
              >
                <option value="">
                  {eventsQ.isLoading ? "Cargando eventos..." : "Selecciona un evento"}
                </option>
                {eventOptions.map((e) => (
                  <option key={e.id} value={e.id}>
                    #{e.id} · {e.title} · {e.date}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Email del beneficiario" icon={<Mail className="h-3.5 w-3.5" />} error={errors.buyer_email}>
              <input
                type="email"
                value={form.buyer_email}
                onChange={(e) => setForm({ ...form, buyer_email: e.target.value })}
                className="inp"
                placeholder="persona@example.com"
              />
            </Field>

            <Field label="Nombre completo" icon={<User className="h-3.5 w-3.5" />} error={errors.buyer_full_name}>
              <input
                type="text"
                value={form.buyer_full_name}
                onChange={(e) => setForm({ ...form, buyer_full_name: e.target.value })}
                className="inp"
                placeholder="Juan Pérez"
              />
            </Field>

            <Field label="Motivo de cortesía" icon={<FileText className="h-3.5 w-3.5" />} error={errors.issue_reason}>
              <input
                type="text"
                value={form.issue_reason}
                onChange={(e) => setForm({ ...form, issue_reason: e.target.value })}
                className="inp"
                placeholder="Ej: Staff, Prensa, Invitado VIP"
                list="comp-reasons"
              />
              <datalist id="comp-reasons">
                {COMMON_REASONS.map((r) => <option key={r} value={r} />)}
              </datalist>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Cantidad" icon={<Hash className="h-3.5 w-3.5" />} error={errors.quantity}>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                  className="inp"
                />
                <p className="text-xs text-white/40">Máximo 20 por emisión</p>
              </Field>
              <Field label="Tipo">
                <input
                  type="text"
                  value={form.ticket_type ?? ""}
                  onChange={(e) => setForm({ ...form, ticket_type: e.target.value })}
                  className="inp"
                  list="comp-types"
                />
                <datalist id="comp-types">
                  {COMMON_TYPES.map((t) => <option key={t} value={t} />)}
                </datalist>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo de asiento (opcional)">
                <input
                  type="text"
                  value={form.seat_type ?? ""}
                  onChange={(e) => setForm({ ...form, seat_type: e.target.value || null })}
                  className="inp"
                  placeholder="general, VIP..."
                />
              </Field>
              <Field label="Puerta (opcional)">
                <input
                  type="text"
                  value={form.gate_number ?? ""}
                  onChange={(e) => setForm({ ...form, gate_number: e.target.value || null })}
                  className="inp"
                  placeholder="A, B, 1..."
                />
              </Field>
            </div>
          </div>
        )}

        {!result && (
          <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-white/10 bg-[#0f0f0f] px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={issue.isPending}
              className="flex items-center gap-2 rounded-lg bg-[#eab308] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#ca9b09] disabled:opacity-50"
            >
              {issue.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
              Emitir {form.quantity > 1 ? `${form.quantity} cortesías` : "cortesía"}
            </button>
          </div>
        )}

        <style>{`
          .inp {
            width: 100%;
            border-radius: 0.5rem;
            border: 1px solid rgba(255,255,255,0.1);
            background: #1a1a1a;
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            color: #fff;
            outline: none;
          }
          .inp:focus { border-color: rgba(234,179,8,0.5); box-shadow: 0 0 0 1px rgba(234,179,8,0.3); }
          .inp::placeholder { color: rgba(255,255,255,0.3); }
          .inp:disabled { opacity: 0.5; cursor: not-allowed; }
        `}</style>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  error,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-xs font-medium text-white/70">
        {icon}
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-[#f87171]">{error}</p>}
    </div>
  );
}

function SuccessView({
  tickets,
  onCopy,
  onClose,
  onIssueAnother,
}: {
  tickets: { id: string; ticket_code: string }[];
  onCopy: () => void;
  onClose: () => void;
  onIssueAnother: () => void;
}) {
  return (
    <div className="px-6 py-6">
      <div className="mb-4 flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#22c55e]/15 text-[#22c55e]">
          <Check className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-lg font-semibold text-white">
          {tickets.length} cortesía{tickets.length !== 1 ? "s" : ""} emitida{tickets.length !== 1 ? "s" : ""}
        </h3>
        <p className="text-xs text-white/50">Los QR ya están generados y la acción quedó registrada en el audit log</p>
      </div>

      <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-[#1a1a1a] p-3">
        <ul className="space-y-1 font-mono text-xs text-white/80">
          {tickets.map((t) => (
            <li key={t.id} className="flex items-center justify-between">
              <span>{t.ticket_code}</span>
              <span className="text-white/30">#{t.id.substring(0, 8)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          onClick={onCopy}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-xs text-white/70 hover:bg-[#222] hover:text-white"
        >
          <Copy className="h-3.5 w-3.5" /> Copiar códigos
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onIssueAnother}
            className="rounded-lg px-3 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white"
          >
            Emitir otra
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-[#c61619] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b01217]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
