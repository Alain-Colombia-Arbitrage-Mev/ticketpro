import { useState } from "react";
import {
  X,
  Mail,
  Shield,
  UserCog,
  User,
  Loader2,
  UserPlus,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { useCreateUser, UserRole, CreateUserResult } from "../../hooks/useAdminUsers";

interface Props {
  onClose: () => void;
}

const ROLE_OPTIONS: {
  value: UserRole;
  label: string;
  description: string;
  color: string;
  icon: React.ElementType;
}[] = [
  {
    value: "admin",
    label: "Admin",
    description: "Acceso total al panel, gestión de roles y reportes",
    color: "#c61619",
    icon: Shield,
  },
  {
    value: "hoster",
    label: "Hoster",
    description: "Valida tickets y gestiona eventos asignados",
    color: "#3b82f6",
    icon: UserCog,
  },
  {
    value: "user",
    label: "Usuario",
    description: "Comprador estándar, sin acceso admin",
    color: "#6b7280",
    icon: User,
  },
];

export function AddUserModal({ onClose }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [role, setRole] = useState<UserRole>("hoster");
  const [result, setResult] = useState<CreateUserResult | null>(null);
  const create = useCreateUser();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("Email inválido");
      return;
    }
    if (!autoGenerate && password && password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    try {
      const res = await create.mutateAsync({
        email: trimmedEmail,
        role,
        name: name.trim() || undefined,
        password: autoGenerate ? undefined : (password || undefined),
      });

      const modeLabel =
        res.mode === "created"
          ? "Usuario creado"
          : res.mode === "promoted"
          ? "Rol actualizado"
          : "Contraseña reseteada";
      toast.success(modeLabel);

      // If password was generated OR reset, keep modal open to show the creds.
      if (res.generatedPassword || res.mode !== "promoted") {
        setResult(res);
      } else {
        onClose();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(msg);
    }
  };

  // ── Success screen with credentials ──────────────────────────────────────
  if (result) {
    const pwd = result.generatedPassword ?? (autoGenerate ? null : password);
    return (
      <Overlay onClose={onClose}>
        <div className="px-5 py-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/30">
              <Check className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {result.mode === "created" ? "Usuario creado" : result.mode === "promoted" ? "Rol actualizado" : "Contraseña reseteada"}
              </h3>
              <p className="text-xs text-white/50">
                {result.mode === "created"
                  ? "Compartí estas credenciales — no se van a mostrar de nuevo"
                  : result.mode === "password-reset"
                  ? "Contraseña cambiada exitosamente"
                  : `Rol cambiado de ${result.previousRole} a ${result.role}`}
              </p>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-white/10 bg-[#13131a] p-4">
            <CredRow label="Email" value={result.email} />
            <CredRow label="Rol" value={result.role} />
            {pwd && <CredRow label="Contraseña" value={pwd} mono sensitive />}
            {result.userId && (
              <CredRow label="User ID" value={result.userId} mono small />
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-[#c61619] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b01217]"
            >
              Entendido
            </button>
          </div>
        </div>
      </Overlay>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────
  return (
    <Overlay onClose={onClose}>
      <form onSubmit={submit}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-br from-[#13131a] to-[#0f0f13] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#c61619]/15 ring-1 ring-[#c61619]/30">
              <UserPlus className="h-5 w-5 text-[#ff5a5d]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Añadir usuario</h2>
              <p className="text-xs text-white/50">
                Se crea con email + contraseña. Si el email ya existe, solo cambia rol / clave.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-5">
          {/* Email */}
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/60">
              <Mail className="h-3 w-3" />
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
              placeholder="persona@ejemplo.com"
              className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#c61619]/50 focus:outline-none focus:ring-1 focus:ring-[#c61619]/30"
            />
          </label>

          {/* Name */}
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/60">
              Nombre <span className="text-white/30 normal-case">(opcional)</span>
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="María Pérez"
              className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#c61619]/50 focus:outline-none focus:ring-1 focus:ring-[#c61619]/30"
            />
          </label>

          {/* Password */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/60">
                Contraseña
              </span>
              <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-white/60 hover:text-white">
                <input
                  type="checkbox"
                  checked={autoGenerate}
                  onChange={(e) => {
                    setAutoGenerate(e.target.checked);
                    if (e.target.checked) setPassword("");
                  }}
                  className="h-3 w-3 cursor-pointer accent-[#c61619]"
                />
                <Sparkles className="h-3 w-3" />
                Generar automáticamente
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={autoGenerate ? "" : password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={autoGenerate}
                required={!autoGenerate}
                minLength={autoGenerate ? undefined : 8}
                placeholder={autoGenerate ? "Se generará al enviar" : "mínimo 8 caracteres"}
                className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2.5 pr-10 text-sm text-white placeholder:text-white/30 focus:border-[#c61619]/50 focus:outline-none focus:ring-1 focus:ring-[#c61619]/30 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {!autoGenerate && (
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-white/50 hover:bg-white/5 hover:text-white"
                  aria-label={showPassword ? "Ocultar" : "Mostrar"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Role */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/60">
              Rol
            </p>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = role === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setRole(opt.value)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                      selected
                        ? "bg-white/[0.04]"
                        : "border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]"
                    }`}
                    style={
                      selected
                        ? {
                            borderColor: `${opt.color}60`,
                            boxShadow: `0 0 0 1px ${opt.color}40, inset 0 1px 0 rgba(255,255,255,0.04)`,
                          }
                        : undefined
                    }
                  >
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ring-1"
                      style={{
                        backgroundColor: `${opt.color}20`,
                        boxShadow: `inset 0 0 0 1px ${opt.color}30`,
                      }}
                    >
                      <Icon className="h-4 w-4" style={{ color: opt.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{opt.label}</p>
                      <p className="text-xs text-white/50">{opt.description}</p>
                    </div>
                    <span
                      className={`mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        selected ? "" : "border-white/20"
                      }`}
                      style={selected ? { borderColor: opt.color } : undefined}
                    >
                      {selected && (
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: opt.color }}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 bg-[#0a0a0a] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={create.isPending}
            className="flex items-center gap-2 rounded-lg bg-[#c61619] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#c61619]/20 hover:bg-[#b01217] disabled:opacity-50"
          >
            {create.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {create.isPending ? "Creando…" : "Crear usuario"}
          </button>
        </div>
      </form>
    </Overlay>
  );
}

function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f0f] shadow-2xl"
      >
        {children}
      </div>
    </div>
  );
}

function CredRow({
  label,
  value,
  mono,
  sensitive,
  small,
}: {
  label: string;
  value: string;
  mono?: boolean;
  sensitive?: boolean;
  small?: boolean;
}) {
  const [hidden, setHidden] = useState(!!sensitive);
  const copy = () => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copiado`);
  };
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 flex-shrink-0 text-[11px] font-semibold uppercase tracking-wider text-white/50">
        {label}
      </span>
      <code
        className={`flex-1 truncate rounded-md bg-black/40 px-2 py-1.5 ${
          mono ? "font-mono" : ""
        } ${small ? "text-[10px]" : "text-xs"} text-white`}
      >
        {hidden ? "•".repeat(Math.min(value.length, 20)) : value}
      </code>
      {sensitive && (
        <button
          type="button"
          onClick={() => setHidden((h) => !h)}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-white/50 hover:bg-white/10 hover:text-white"
          aria-label={hidden ? "Mostrar" : "Ocultar"}
        >
          {hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>
      )}
      <button
        type="button"
        onClick={copy}
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-white/50 hover:bg-white/10 hover:text-white"
        aria-label="Copiar"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
