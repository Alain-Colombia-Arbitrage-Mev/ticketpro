import { useEffect, useState, useMemo } from "react";
import { X, Loader2, UserPlus, Trash2, Search, Calendar, MapPin, Tag, DollarSign, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  AdminEventRow,
  AdminEventInput,
  useCreateEvent,
  useUpdateEvent,
  useEventHosters,
  useAssignHoster,
  useUnassignHoster,
  useSearchHosterCandidates,
} from "../../hooks/useAdminEvents";
import { useAuth } from "../../hooks/useAuth";

interface Props {
  event: AdminEventRow | null; // null = create mode
  onClose: () => void;
}

const CATEGORIES = ["Conferencia", "Concierto", "Deporte", "Festival", "Teatro", "Feria", "Otro"];

function emptyForm(): AdminEventInput {
  return {
    title: "",
    date: "",
    time: "",
    location: "",
    category: "Conferencia",
    description: "",
    image_url: "",
    base_price: 0,
    currency: "USD",
    is_active: true,
    featured: false,
    trending: false,
    sold_out: false,
    last_tickets: false,
  };
}

function eventToForm(e: AdminEventRow): AdminEventInput {
  return {
    title: e.title,
    date: e.date?.substring(0, 10) ?? "",
    time: e.time ?? "",
    location: e.location,
    category: e.category,
    description: e.description ?? "",
    image_url: e.image_url ?? "",
    base_price: Number(e.base_price) || 0,
    currency: e.currency ?? "USD",
    is_active: e.is_active ?? true,
    featured: e.featured ?? false,
    trending: e.trending ?? false,
    sold_out: e.sold_out ?? false,
    last_tickets: e.last_tickets ?? false,
  };
}

export function EventFormModal({ event, onClose }: Props) {
  const isEdit = !!event;
  const [form, setForm] = useState<AdminEventInput>(() => (event ? eventToForm(event) : emptyForm()));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createMut = useCreateEvent();
  const updateMut = useUpdateEvent();
  const saving = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    setForm(event ? eventToForm(event) : emptyForm());
    setErrors({});
  }, [event]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = "Requerido";
    if (!form.date) next.date = "Requerido";
    if (!form.location.trim()) next.location = "Requerido";
    if (!form.category.trim()) next.category = "Requerido";
    if (form.base_price < 0) next.base_price = "No puede ser negativo";
    if (form.image_url && !/^https?:\/\/|^\//.test(form.image_url))
      next.image_url = "Debe ser URL http(s) o ruta /…";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    try {
      if (isEdit && event) {
        await updateMut.mutateAsync({ id: event.id, patch: form });
        toast.success("Evento actualizado");
      } else {
        const created = await createMut.mutateAsync(form);
        toast.success(`Evento #${created.id} creado`);
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      toast.error(msg);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-white/10 bg-[#0f0f0f] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0f0f0f] px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {isEdit ? `Editar evento #${event!.id}` : "Nuevo evento"}
            </h2>
            <p className="text-xs text-white/50">{isEdit ? "Actualiza los datos y hosters asignados" : "Crea un nuevo evento"}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <Section title="Información general">
            <Field label="Título" error={errors.title}>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="inp"
                placeholder="Open Salinas California 2026"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Fecha" icon={<Calendar className="h-3.5 w-3.5" />} error={errors.date}>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="inp"
                />
              </Field>
              <Field label="Hora">
                <input
                  type="time"
                  value={form.time ?? ""}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="inp"
                />
              </Field>
            </div>

            <Field label="Ubicación" icon={<MapPin className="h-3.5 w-3.5" />} error={errors.location}>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="inp"
                placeholder="940 N Main ST, Salinas, CA 93906"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Categoría" icon={<Tag className="h-3.5 w-3.5" />} error={errors.category}>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="inp [&>option]:bg-[#1a1a1a]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Precio base (USD)" icon={<DollarSign className="h-3.5 w-3.5" />} error={errors.base_price}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.base_price}
                  onChange={(e) => setForm({ ...form, base_price: parseFloat(e.target.value) || 0 })}
                  className="inp"
                />
              </Field>
            </div>

            <Field label="URL de imagen" icon={<ImageIcon className="h-3.5 w-3.5" />} error={errors.image_url}>
              <input
                type="text"
                value={form.image_url ?? ""}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="inp"
                placeholder="/images/events/mi-evento.png o https://..."
              />
            </Field>

            <Field label="Descripción">
              <textarea
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="inp resize-y"
                placeholder="Descripción del evento..."
              />
            </Field>
          </Section>

          <Section title="Flags">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <FlagToggle label="Activo" value={form.is_active!} onChange={(v) => setForm({ ...form, is_active: v })} />
              <FlagToggle label="Destacado" value={form.featured!} onChange={(v) => setForm({ ...form, featured: v })} />
              <FlagToggle label="Trending" value={form.trending!} onChange={(v) => setForm({ ...form, trending: v })} />
              <FlagToggle label="Agotado" value={form.sold_out!} onChange={(v) => setForm({ ...form, sold_out: v })} />
              <FlagToggle label="Últimas boletas" value={form.last_tickets!} onChange={(v) => setForm({ ...form, last_tickets: v })} />
            </div>
          </Section>

          {isEdit && event && <HostersSection eventId={event.id} />}
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-white/10 bg-[#0f0f0f] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[#c61619] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b01217] disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Guardar cambios" : "Crear evento"}
          </button>
        </div>

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
          .inp:focus { border-color: rgba(198,22,25,0.5); box-shadow: 0 0 0 1px rgba(198,22,25,0.3); }
          .inp::placeholder { color: rgba(255,255,255,0.3); }
        `}</style>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold">{title}</h3>
      <div className="space-y-3">{children}</div>
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

function FlagToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
        value
          ? "border-[#c61619]/50 bg-[#c61619]/10 text-white"
          : "border-white/10 bg-[#1a1a1a] text-white/60 hover:text-white"
      }`}
    >
      <span>{label}</span>
      <span
        className={`inline-block h-4 w-7 rounded-full transition-colors ${value ? "bg-[#c61619]" : "bg-white/20"}`}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-3" : "translate-x-0"}`}
        />
      </span>
    </button>
  );
}

function HostersSection({ eventId }: { eventId: number }) {
  const { user } = useAuth();
  const { data: hosters, isLoading } = useEventHosters(eventId);
  const [search, setSearch] = useState("");
  const { data: candidates } = useSearchHosterCandidates(search);
  const assign = useAssignHoster();
  const unassign = useUnassignHoster();

  const assignedIds = useMemo(() => new Set(hosters?.map((h) => h.user_id) ?? []), [hosters]);
  const visibleCandidates = (candidates ?? []).filter((c) => !assignedIds.has(c.id));

  async function handleAssign(userId: string) {
    if (!user) return;
    try {
      await assign.mutateAsync({ eventId, userId, assignedBy: user.id });
      toast.success("Hoster asignado");
      setSearch("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al asignar";
      toast.error(msg);
    }
  }

  async function handleUnassign(id: string) {
    try {
      await unassign.mutateAsync({ id, eventId });
      toast.success("Hoster removido");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al remover";
      toast.error(msg);
    }
  }

  return (
    <Section title="Hosters asignados">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar usuario por email o nombre (mín 2 caracteres)"
          className="inp pl-9"
        />
        {search.length >= 2 && visibleCandidates.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-[#1a1a1a] shadow-xl">
            {visibleCandidates.map((c) => (
              <button
                key={c.id}
                onClick={() => handleAssign(c.id)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-white/80 hover:bg-[#222]"
              >
                <div>
                  <div>{c.name || c.email}</div>
                  <div className="text-xs text-white/40">{c.email} · {c.role}</div>
                </div>
                <UserPlus className="h-4 w-4 text-white/50" />
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Loader2 className="h-3 w-3 animate-spin" /> Cargando hosters...
        </div>
      ) : hosters?.length ? (
        <ul className="space-y-2">
          {hosters.map((h) => (
            <li
              key={h.id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2"
            >
              <div className="text-sm">
                <div className="text-white">{h.profile?.name || h.profile?.email || h.user_id}</div>
                <div className="text-xs text-white/40">
                  {h.profile?.email} · {h.profile?.role ?? "?"} · desde {new Date(h.assigned_at).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => handleUnassign(h.id)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-white/60 hover:bg-[#c61619]/10 hover:text-[#f87171]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remover
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-white/40">Ningún hoster asignado. Busca uno arriba para agregarlo.</p>
      )}
    </Section>
  );
}
