import { useCallback, useRef, useState } from "react";
import {
  Upload,
  Loader2,
  AlertTriangle,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Copy,
  Eye,
  Monitor,
  LayoutGrid,
  FileImage,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import {
  uploadEventImages,
  deleteEventImage,
  VARIANT_SIZES,
  type ImageVariant,
} from "../../utils/imageUpload";

export interface ImageUploaderValue {
  slider?: string;
  card?: string;
  detail?: string;
  venue?: string;
}

interface Props {
  eventKey: string;
  value: ImageUploaderValue;
  onChange: (next: ImageUploaderValue) => void;
  disabled?: boolean;
}

type SlotPhase = "idle" | "resizing" | "uploading" | "error" | "deleting";

const VARIANT_META: Record<
  ImageVariant,
  { label: string; description: string; icon: typeof ImageIcon; aspect: string }
> = {
  slider: {
    label: "Slider principal",
    description: "Hero ancho del home / destacados",
    icon: Monitor,
    aspect: "aspect-[2.4/1]",
  },
  card: {
    label: "Card / tarjeta",
    description: "Grilla de eventos y listados",
    icon: LayoutGrid,
    aspect: "aspect-[4/3]",
  },
  detail: {
    label: "Detalle del evento",
    description: "Imagen principal en la página del evento",
    icon: FileImage,
    aspect: "aspect-[3/2]",
  },
  venue: {
    label: "Información del lugar",
    description: "Foto del venue en la página del evento",
    icon: MapPin,
    aspect: "aspect-video",
  },
};

export function ImageUploader({ eventKey, value, onChange, disabled }: Props) {
  // One phase per slot so uploads/deletes don't block each other.
  const [phases, setPhases] = useState<Record<ImageVariant, SlotPhase>>({
    slider: "idle",
    card: "idle",
    detail: "idle",
    venue: "idle",
  });
  const [errors, setErrors] = useState<Record<ImageVariant, string | null>>({
    slider: null,
    card: null,
    detail: null,
    venue: null,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const setPhase = (v: ImageVariant, p: SlotPhase) =>
    setPhases((prev) => ({ ...prev, [v]: p }));
  const setError = (v: ImageVariant, e: string | null) =>
    setErrors((prev) => ({ ...prev, [v]: e }));

  // Core upload (single or multiple variants from one source file).
  const uploadFile = useCallback(
    async (file: File, variants: ImageVariant[]) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Solo se aceptan imágenes (jpg, png, webp, avif)");
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        toast.error("Máximo 15MB");
        return;
      }
      if (!eventKey) {
        toast.error("Escribí el título del evento primero");
        return;
      }

      variants.forEach((v) => {
        setError(v, null);
        setPhase(v, "resizing");
      });

      try {
        const { urls } = await uploadEventImages({
          eventKey,
          source: file,
          variants,
          onProgress: (ph) => variants.forEach((v) => setPhase(v, ph)),
        });

        // Delete any replaced images (best-effort, don't fail the upload flow).
        for (const v of variants) {
          const prev = value[v];
          const fresh = urls[v];
          if (prev && fresh && prev !== fresh) {
            deleteEventImage(prev).catch(() => { /* ignore */ });
          }
        }

        onChange({
          slider: urls.slider ?? value.slider,
          card: urls.card ?? value.card,
          detail: urls.detail ?? value.detail,
          venue: urls.venue ?? value.venue,
        });
        variants.forEach((v) => setPhase(v, "idle"));
        toast.success(
          variants.length === 1
            ? `${VARIANT_META[variants[0]].label} actualizada`
            : "Imagen aplicada a las 3 variantes"
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error al subir";
        variants.forEach((v) => {
          setPhase(v, "error");
          setError(v, msg);
        });
        toast.error(msg);
      }
    },
    [eventKey, onChange, value]
  );

  const handleDelete = useCallback(
    async (variant: ImageVariant) => {
      const url = value[variant];
      if (!url) return;
      if (!confirm(`¿Eliminar la imagen "${VARIANT_META[variant].label}"?`)) return;

      setPhase(variant, "deleting");
      try {
        await deleteEventImage(url);
        onChange({ ...value, [variant]: undefined });
        toast.success("Imagen eliminada");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error al eliminar";
        toast.error(msg);
      } finally {
        setPhase(variant, "idle");
      }
    },
    [onChange, value]
  );

  // "Apply to all" only covers the 3 event-poster variants. The venue photo
  // is conceptually different (the location, not the event poster) and must
  // be uploaded separately through its own slot.
  const uploadToAll = (file: File) => uploadFile(file, ["slider", "card", "detail"]);

  const hasAny = !!(value.slider || value.card || value.detail || value.venue);

  return (
    <div className="space-y-3">
      {/* Convenience bar: one source → all 3 variants */}
      <QuickAllUploader
        onPick={uploadToAll}
        disabled={disabled || Object.values(phases).some((p) => p === "resizing" || p === "uploading")}
        eventKeyReady={!!eventKey}
      />

      {/* Per-variant slots: 3 poster variants + venue photo */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {(["slider", "card", "detail"] as ImageVariant[]).map((variant) => (
          <VariantSlot
            key={variant}
            variant={variant}
            url={value[variant]}
            phase={phases[variant]}
            error={errors[variant]}
            disabled={!!disabled}
            onFile={(file) => uploadFile(file, [variant])}
            onDelete={() => handleDelete(variant)}
            onPreview={() => setPreviewUrl(value[variant] || null)}
            eventKeyReady={!!eventKey}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <VariantSlot
          variant="venue"
          url={value.venue}
          phase={phases.venue}
          error={errors.venue}
          disabled={!!disabled}
          onFile={(file) => uploadFile(file, ["venue"])}
          onDelete={() => handleDelete("venue")}
          onPreview={() => setPreviewUrl(value.venue || null)}
          eventKeyReady={!!eventKey}
        />
      </div>

      {hasAny && (
        <p className="text-[11px] text-white/40">
          Las imágenes se almacenan en <code className="text-white/60">imagenes.veltlix.com</code> (R2).
          Cada variante es independiente — reemplazá o eliminá sin afectar a las otras.
        </p>
      )}

      {previewUrl && (
        <PreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
      )}
    </div>
  );
}

// ─── Per-variant slot ────────────────────────────────────────────────────────

function VariantSlot({
  variant,
  url,
  phase,
  error,
  disabled,
  onFile,
  onDelete,
  onPreview,
  eventKeyReady,
}: {
  variant: ImageVariant;
  url?: string;
  phase: SlotPhase;
  error: string | null;
  disabled: boolean;
  onFile: (file: File) => void;
  onDelete: () => void;
  onPreview: () => void;
  eventKeyReady: boolean;
}) {
  const meta = VARIANT_META[variant];
  const { w, h } = VARIANT_SIZES[variant];
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = phase === "resizing" || phase === "uploading" || phase === "deleting";
  const Icon = meta.icon;

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled || busy) return;
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-[#c61619]/15 text-[#ff5a5d] ring-1 ring-[#c61619]/20">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">{meta.label}</p>
            <p className="truncate text-[10px] text-white/45">{meta.description}</p>
          </div>
        </div>
        <span className="flex-shrink-0 rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white/70">
          {w}×{h}
        </span>
      </div>

      {/* Preview / drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={`relative w-full ${meta.aspect} bg-black/30 ${
          busy ? "ring-2 ring-inset ring-[#c61619]/40" : ""
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={onPick}
          className="sr-only"
          disabled={disabled || busy || !eventKeyReady}
        />

        {url ? (
          <>
            <img
              src={url}
              alt={meta.label}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {busy && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
          </>
        ) : busy ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
            <Loader2 className="h-6 w-6 animate-spin text-[#ff5a5d]" />
            <p className="text-xs font-medium">
              {phase === "resizing" ? "Redimensionando…" : "Subiendo…"}
            </p>
          </div>
        ) : phase === "error" ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-amber-500/5 text-amber-300/90 hover:bg-amber-500/10"
            disabled={!eventKeyReady}
          >
            <AlertTriangle className="h-6 w-6" />
            <p className="text-xs font-semibold">Reintentar</p>
            {error && <p className="px-4 text-[10px] text-white/50 line-clamp-2">{error}</p>}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || !eventKeyReady}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/15 transition-colors hover:border-white/30 hover:bg-white/[0.03] disabled:opacity-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/10">
              <Upload className="h-5 w-5 text-white/70" />
            </div>
            <p className="text-xs font-medium text-white">
              {eventKeyReady ? "Arrastrá o elegí" : "Escribí el título primero"}
            </p>
            <p className="text-[10px] text-white/40">
              Recomendado: {w}×{h}px
            </p>
          </button>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] px-2 py-2">
        {url ? (
          <>
            <button
              type="button"
              onClick={onPreview}
              disabled={busy}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-white/70 hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
            >
              <Eye className="h-3.5 w-3.5" />
              Ver
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-white/70 hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reemplazar
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={busy}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-white/60 hover:bg-[#c61619]/10 hover:text-[#ff5a5d] disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar
              </button>
            </div>
          </>
        ) : (
          <p className="px-1 text-[11px] text-white/40">Sin imagen — subí una abajo</p>
        )}
      </div>
    </div>
  );
}

// ─── Quick "apply to all" bar ────────────────────────────────────────────────

function QuickAllUploader({
  onPick,
  disabled,
  eventKeyReady,
}: {
  onPick: (file: File) => void;
  disabled: boolean;
  eventKeyReady: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onPick(file);
    e.target.value = "";
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-gradient-to-br from-[#131316] to-[#0d0d10] px-4 py-3">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-semibold text-white">
          <Copy className="h-4 w-4 text-[#ff5a5d]" />
          Aplicar 1 imagen a las 3 variantes
        </p>
        <p className="text-[11px] text-white/50">
          Atajo: subí una sola imagen y se redimensiona automáticamente a los 3 tamaños (slider, card, detail).
        </p>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || !eventKeyReady}
        className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-[#c61619] px-3 py-2 text-xs font-semibold text-white hover:bg-[#b01217] disabled:opacity-50"
      >
        <Upload className="h-3.5 w-3.5" />
        Subir única
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={handle}
        className="sr-only"
      />
    </div>
  );
}

// ─── Preview modal ───────────────────────────────────────────────────────────

function PreviewModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-5xl overflow-auto rounded-xl border border-white/10 bg-[#0a0a0a]"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={url} alt="Preview" className="block max-h-[85vh] w-auto" />
        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-[11px] text-white/50 hover:text-white"
          >
            {url}
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/15"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
