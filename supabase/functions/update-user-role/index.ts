/**
 * Supabase Edge Function: Update User Role
 *
 * Permite a administradores cambiar el `profiles.role` de cualquier usuario.
 * Valida:
 *   - El caller tiene role `admin`
 *   - El target existe en `profiles`
 *   - El rol nuevo es válido: user | hoster | admin
 *   - No se degrada al último admin del sistema (siempre ≥ 1 admin activo)
 *   - No se degrada a sí mismo (paranoia; require self-remove explícito)
 *
 * Registra la acción en `admin_audit_log` con before/after para trazabilidad.
 *
 * Body (JSON):
 *   - user_id: string (UUID, required)
 *   - new_role: "user" | "hoster" | "admin" (required)
 *   - reason?: string (optional)
 *
 * Env:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { CORS_HEADERS, corsResponse } from "../_shared/cors.ts";
import { verifyRole } from "../_shared/auth.ts";

const ALLOWED_ROLES = ["user", "hoster", "admin"] as const;
type Role = (typeof ALLOWED_ROLES)[number];

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

interface Body {
  user_id?: string;
  new_role?: string;
  reason?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceKey) {
    return json(500, { error: "Server not configured" });
  }

  // Only admins can invoke
  const role = await verifyRole(req, supabaseUrl, supabaseServiceKey, ["admin"]);
  if (role.error || !role.user) {
    return json(401, { error: role.error ?? "Admin role required" });
  }
  const actor = role.user;

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const targetId = body.user_id?.trim();
  const newRole = body.new_role?.trim() as Role;
  const reason = body.reason?.trim() || null;

  if (!targetId) return json(400, { error: "user_id requerido" });
  if (!ALLOWED_ROLES.includes(newRole)) {
    return json(400, { error: `new_role inválido. Permitidos: ${ALLOWED_ROLES.join(", ")}` });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch target profile
  const { data: target, error: targetErr } = await supabase
    .from("profiles")
    .select("id, email, name, role")
    .eq("id", targetId)
    .maybeSingle();
  if (targetErr) return json(500, { error: "Error al leer perfil", details: targetErr.message });
  if (!target) return json(404, { error: "Usuario no encontrado" });

  const oldRole = (target.role ?? "user") as Role;
  if (oldRole === newRole) return json(200, { ok: true, unchanged: true });

  // Guardrail 1: self-demotion — require explicit scenario, and always forbid self-demote from admin
  if (actor.id === targetId && oldRole === "admin" && newRole !== "admin") {
    return json(400, {
      error: "No puedes quitarte tu propio rol de admin. Pide a otro admin que lo haga.",
    });
  }

  // Guardrail 2: if target is currently admin and is being demoted, verify there will still be ≥ 1 admin left
  if (oldRole === "admin" && newRole !== "admin") {
    const { count, error: cntErr } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (cntErr) return json(500, { error: "Error verificando admins", details: cntErr.message });
    if ((count ?? 0) <= 1) {
      return json(400, {
        error: "No se puede degradar al último admin. Asigna otro admin primero.",
      });
    }
  }

  // Apply update
  const { error: updErr } = await supabase
    .from("profiles")
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", targetId);
  if (updErr) return json(500, { error: "No se pudo actualizar el rol", details: updErr.message });

  // Audit
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const userAgent = req.headers.get("user-agent") || null;

  await supabase.from("admin_audit_log").insert({
    actor_id: actor.id,
    actor_email: actor.email,
    action: "role.update",
    target_type: "user",
    target_id: targetId,
    before_data: { role: oldRole, email: target.email, name: target.name },
    after_data: { role: newRole, reason },
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  return json(200, {
    ok: true,
    user: { id: targetId, email: target.email, name: target.name, role: newRole },
    previous_role: oldRole,
  });
});
