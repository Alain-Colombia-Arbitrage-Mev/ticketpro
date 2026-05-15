// Cloudflare Worker for admin.veltlix.com.
//
// Responsibilities:
//   1. Serve the SPA static assets (dist/).
//   2. Expose /api/upload so the admin panel can push event images to R2
//      without leaking credentials to the browser. The Worker authenticates
//      the caller by forwarding the Supabase access token to /auth/v1/user
//      and then verifying the resolved user has role = 'admin' or 'hoster'
//      in public.profiles via PostgREST.
//
// Public image URL:  ${PUBLIC_IMAGE_HOST}/events/{eventKey}/{variant}-{ts}.{ext}
// The R2 bucket `ticketpro-images` is bound as env.IMAGES.

const UPLOAD_PATH = "/api/upload";
const USERS_PATH = "/api/users";
const MAX_BYTES = 10 * 1024 * 1024; // 10MB per file
const VALID_VARIANTS = new Set(["slider", "card", "detail", "venue"]);
const VALID_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const VALID_ROLES = new Set(["admin", "hoster", "user"]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === UPLOAD_PATH) {
      if (request.method === "DELETE") return handleDelete(request, env);
      return handleUpload(request, env);
    }

    if (url.pathname === USERS_PATH) {
      return handleCreateUser(request, env);
    }

    // /api/users/<uuid>
    if (url.pathname.startsWith(USERS_PATH + "/")) {
      const userId = url.pathname.slice(USERS_PATH.length + 1);
      return handleUserById(request, env, userId);
    }

    return env.ASSETS.fetch(request);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────────────────────────────────────

function corsHeaders(request, env) {
  const origin = request.headers.get("origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim());
  const allowThis = allowed.includes(origin) ? origin : allowed[0] || "*";
  return {
    "Access-Control-Allow-Origin": allowThis,
    "Access-Control-Allow-Methods": "POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

// Admin-only (strict) check — reuses verifyAdmin but rejects hosters.
async function verifyAdminStrict(request, env) {
  const result = await verifyAdmin(request, env);
  if (!result.ok) return result;
  if (result.role !== "admin") {
    return { ok: false, status: 403, error: "Only admins can perform this action" };
  }
  return result;
}

function json(body, init = {}, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
      ...(init.headers || {}),
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth: verify Supabase access token + admin/hoster role
// ─────────────────────────────────────────────────────────────────────────────

async function verifyAdmin(request, env) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return { ok: false, status: 401, error: "Missing bearer token" };

  const anonKey = env.SUPABASE_ANON_KEY;
  if (!anonKey) {
    return { ok: false, status: 500, error: "Worker missing SUPABASE_ANON_KEY" };
  }

  // 1. Resolve user from token. Supabase requires apikey=<anon>, not the JWT.
  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
  });
  if (!userRes.ok) {
    let detail = "";
    try { const b = await userRes.json(); detail = b?.msg || b?.error_description || b?.error || ""; } catch {}
    return { ok: false, status: 401, error: `Invalid token${detail ? ": " + detail : ""}` };
  }
  const user = await userRes.json();
  if (!user?.id) return { ok: false, status: 401, error: "No user" };

  // 2. Read role from public.profiles using the caller's own JWT (RLS-safe),
  //    still with the anon apikey required by PostgREST.
  const profRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=role`,
    { headers: { Authorization: `Bearer ${token}`, apikey: anonKey } }
  );
  if (!profRes.ok) return { ok: false, status: 403, error: "Profile lookup failed" };
  const rows = await profRes.json();
  const role = rows?.[0]?.role;
  if (role !== "admin" && role !== "hoster") {
    return { ok: false, status: 403, error: "Not authorized" };
  }
  return { ok: true, user, role };
}

// ─────────────────────────────────────────────────────────────────────────────
// /api/upload
// ─────────────────────────────────────────────────────────────────────────────

async function handleUpload(request, env) {
  const headers = corsHeaders(request, env);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 }, headers);
  }

  const authResult = await verifyAdmin(request, env);
  if (!authResult.ok) {
    return json({ error: authResult.error }, { status: authResult.status }, headers);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Invalid multipart body" }, { status: 400 }, headers);
  }

  const eventKey = String(form.get("eventKey") || "").trim();
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/i.test(eventKey)) {
    return json({ error: "Invalid eventKey (slug or id expected)" }, { status: 400 }, headers);
  }

  // Collect files keyed by variant.
  const results = {};
  for (const variant of VALID_VARIANTS) {
    const file = form.get(variant);
    if (!file || typeof file === "string") continue;
    if (file.size === 0) continue;
    if (file.size > MAX_BYTES) {
      return json(
        { error: `${variant} exceeds ${MAX_BYTES / 1024 / 1024}MB` },
        { status: 413 },
        headers
      );
    }
    if (!VALID_TYPES.has(file.type)) {
      return json(
        { error: `${variant}: unsupported content-type ${file.type}` },
        { status: 415 },
        headers
      );
    }

    const ext = extensionFor(file.type);
    const ts = Date.now();
    const key = `events/${eventKey}/${variant}-${ts}.${ext}`;

    await env.IMAGES.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: "public, max-age=31536000, immutable",
      },
    });

    results[variant] = `${env.PUBLIC_IMAGE_HOST}/${key}`;
  }

  if (Object.keys(results).length === 0) {
    return json({ error: "No files received" }, { status: 400 }, headers);
  }

  return json({ urls: results }, { status: 200 }, headers);
}

function extensionFor(mime) {
  switch (mime) {
    case "image/jpeg": return "jpg";
    case "image/png":  return "png";
    case "image/webp": return "webp";
    case "image/avif": return "avif";
    default:           return "bin";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/upload?url=<public URL>
// Removes a single object from R2. Caller must be admin/hoster. URL must belong
// to PUBLIC_IMAGE_HOST to prevent being used as a generic R2 deleter.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users   { email, role, password?, name? }
//
// Admin-only. Creates a confirmed auth user with the given password and role,
// or promotes an existing one. No email is sent — the admin shares the
// credentials manually. If password is omitted we generate a secure random
// one and return it ONCE in the response (not stored anywhere).
// ─────────────────────────────────────────────────────────────────────────────

async function handleCreateUser(request, env) {
  const headers = corsHeaders(request, env);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 }, headers);
  }

  const authResult = await verifyAdminStrict(request, env);
  if (!authResult.ok) {
    return json({ error: authResult.error }, { status: authResult.status }, headers);
  }

  const service = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!service) {
    return json(
      { error: "Worker missing SUPABASE_SERVICE_ROLE_KEY — admin must set it via `wrangler secret put`" },
      { status: 500 },
      headers
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 }, headers);
  }

  const email = String(body?.email || "").trim().toLowerCase();
  const role = String(body?.role || "").trim();
  const name = body?.name ? String(body.name).trim() : null;
  let password = body?.password ? String(body.password) : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Invalid email" }, { status: 400 }, headers);
  }
  if (!VALID_ROLES.has(role)) {
    return json({ error: "Invalid role" }, { status: 400 }, headers);
  }
  if (password && password.length < 8) {
    return json({ error: "Password must be at least 8 characters" }, { status: 400 }, headers);
  }

  let generatedPassword = null;
  if (!password) {
    password = generatePassword(16);
    generatedPassword = password;
  }

  // 1. Look for an existing profile with that email.
  const existingRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id,role,name`,
    { headers: { apikey: service, Authorization: `Bearer ${service}` } }
  );
  if (!existingRes.ok) {
    return json({ error: "Profile lookup failed" }, { status: 502 }, headers);
  }
  const existing = (await existingRes.json())?.[0];

  if (existing) {
    const beforeRole = existing.role;
    // Update role if needed.
    if (beforeRole !== role) {
      const patchRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${existing.id}`,
        {
          method: "PATCH",
          headers: {
            apikey: service,
            Authorization: `Bearer ${service}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ role, updated_at: new Date().toISOString() }),
        }
      );
      if (!patchRes.ok) {
        const detail = await patchRes.text().catch(() => "");
        return json(
          { error: `Role update failed: ${detail.slice(0, 200)}` },
          { status: 502 },
          headers
        );
      }
    }

    // If a password was provided (or generated), reset it via admin API.
    if (body?.password || generatedPassword) {
      const resetRes = await fetch(
        `${env.SUPABASE_URL}/auth/v1/admin/users/${existing.id}`,
        {
          method: "PUT",
          headers: {
            apikey: service,
            Authorization: `Bearer ${service}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password }),
        }
      );
      if (!resetRes.ok) {
        const detail = await readSupabaseError(resetRes);
        return json(
          { error: `Password reset failed${detail ? ": " + detail : ""}` },
          { status: 502 },
          headers
        );
      }
    }

    await writeAuditLog(env, authResult.user, {
      action: "user.upsert",
      target_type: "user",
      target_id: existing.id,
      before_data: { role: beforeRole, email },
      after_data: {
        role,
        email,
        password_changed: !!(body?.password || generatedPassword),
        via: "admin-panel",
      },
    });

    return json(
      {
        ok: true,
        mode: beforeRole === role ? "password-reset" : "promoted",
        userId: existing.id,
        email,
        role,
        previousRole: beforeRole,
        generatedPassword,
      },
      { status: 200 },
      headers
    );
  }

  // Profile may be missing even when the auth user exists (trigger/RLS drift or
  // older accounts). Recover that case instead of trying to create Auth again.
  const existingAuthUser = await findAuthUserByEmail(env, service, email);
  if (existingAuthUser?.id) {
    const upsertRes = await upsertProfile(env, service, {
      id: existingAuthUser.id,
      email,
      name: name || existingAuthUser.user_metadata?.name || existingAuthUser.email?.split("@")[0] || null,
      role,
    });
    if (!upsertRes.ok) {
      const detail = await upsertRes.text().catch(() => "");
      return json(
        { error: `Profile recovery failed: ${detail.slice(0, 200)}` },
        { status: 502 },
        headers
      );
    }

    const resetRes = await fetch(
      `${env.SUPABASE_URL}/auth/v1/admin/users/${existingAuthUser.id}`,
      {
        method: "PUT",
        headers: {
          apikey: service,
          Authorization: `Bearer ${service}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      }
    );
    if (!resetRes.ok) {
      const detail = await readSupabaseError(resetRes);
      return json(
        { error: `Password reset failed${detail ? ": " + detail : ""}` },
        { status: 502 },
        headers
      );
    }

    await writeAuditLog(env, authResult.user, {
      action: "user.recover_profile",
      target_type: "user",
      target_id: existingAuthUser.id,
      before_data: { email, profile_missing: true },
      after_data: {
        role,
        email,
        name: name || null,
        password_changed: true,
        via: "admin-panel",
      },
    });

    return json(
      {
        ok: true,
        mode: role === "user" ? "password-reset" : "promoted",
        userId: existingAuthUser.id,
        email,
        role,
        generatedPassword,
      },
      { status: 200 },
      headers
    );
  }

  // 2. Create a fresh confirmed user with password + metadata.
  const createRes = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        default_role: role,
        ...(name ? { name } : {}),
      },
    }),
  });
  if (!createRes.ok) {
    const detail = await readSupabaseError(createRes);
    return json(
      { error: `User creation failed${detail ? ": " + detail : ""}` },
      { status: 502 },
      headers
    );
  }
  const created = await createRes.json();
  const userId = created?.id ?? created?.user?.id ?? null;

  // The handle_new_user trigger creates profiles with role='user' regardless
  // of user_metadata.default_role (intentional — see migration
  // 20260428100000). For admin-driven creation we must explicitly set the
  // role + name via service_role, since the caller has already been
  // verified as admin upstream.
  if (userId && (role !== "user" || name)) {
    const profilePatch = {
      ...(role && role !== "user" ? { role } : {}),
      ...(name ? { name } : {}),
      updated_at: new Date().toISOString(),
    };
    const patchRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
      {
        method: "PATCH",
        headers: {
          apikey: service,
          Authorization: `Bearer ${service}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(profilePatch),
      }
    );
    if (!patchRes.ok) {
      const detail = await patchRes.text().catch(() => "");
      return json(
        { error: `Role assignment failed: ${detail.slice(0, 200)}` },
        { status: 502 },
        headers
      );
    }
  }

  await writeAuditLog(env, authResult.user, {
    action: "user.create",
    target_type: "user",
    target_id: userId,
    before_data: null,
    after_data: {
      email,
      role,
      name,
      password_generated: !!generatedPassword,
      via: "admin-panel",
    },
  });

  return json(
    {
      ok: true,
      mode: "created",
      userId,
      email,
      role,
      generatedPassword,
    },
    { status: 200 },
    headers
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/users/:id    — reset an auth user's password.
// DELETE /api/users/:id   — delete an auth user (cascades to profiles).
// ─────────────────────────────────────────────────────────────────────────────

async function handleUserById(request, env, userId) {
  const headers = corsHeaders(request, env);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  if (request.method === "PATCH") {
    return handleResetUserPassword(request, env, userId, headers);
  }
  if (request.method !== "DELETE") {
    return json({ error: "Method not allowed" }, { status: 405 }, headers);
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return json({ error: "Invalid user id" }, { status: 400 }, headers);
  }

  const authResult = await verifyAdminStrict(request, env);
  if (!authResult.ok) {
    return json({ error: authResult.error }, { status: authResult.status }, headers);
  }
  if (authResult.user?.id === userId) {
    return json({ error: "Cannot delete your own account" }, { status: 400 }, headers);
  }

  const service = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!service) {
    return json({ error: "Worker missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 }, headers);
  }

  // Snapshot the profile for the audit log before deletion.
  const beforeRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=id,email,role,name`,
    { headers: { apikey: service, Authorization: `Bearer ${service}` } }
  );
  const before = (await beforeRes.json().catch(() => []))?.[0] ?? null;

  const delRes = await fetch(
    `${env.SUPABASE_URL}/auth/v1/admin/users/${userId}`,
    {
      method: "DELETE",
      headers: { apikey: service, Authorization: `Bearer ${service}` },
    }
  );
  if (!delRes.ok) {
    const detail = await readSupabaseError(delRes);
    return json(
      { error: `User deletion failed${detail ? ": " + detail : ""}` },
      { status: delRes.status === 404 ? 404 : 502 },
      headers
    );
  }

  await writeAuditLog(env, authResult.user, {
    action: "user.delete",
    target_type: "user",
    target_id: userId,
    before_data: before,
    after_data: null,
  });

  return json({ ok: true, deleted: userId }, { status: 200 }, headers);
}

async function handleResetUserPassword(request, env, userId, headers) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return json({ error: "Invalid user id" }, { status: 400 }, headers);
  }

  const authResult = await verifyAdminStrict(request, env);
  if (!authResult.ok) {
    return json({ error: authResult.error }, { status: authResult.status }, headers);
  }
  if (authResult.user?.id === userId) {
    return json({ error: "Cannot reset your own password from this action" }, { status: 400 }, headers);
  }

  const service = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!service) {
    return json({ error: "Worker missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 }, headers);
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  let password = body?.password ? String(body.password) : "";
  let generatedPassword = null;
  if (password && password.length < 8) {
    return json({ error: "Password must be at least 8 characters" }, { status: 400 }, headers);
  }
  if (!password) {
    password = generatePassword(16);
    generatedPassword = password;
  }

  const beforeRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=id,email,role,name`,
    { headers: { apikey: service, Authorization: `Bearer ${service}` } }
  );
  const before = beforeRes.ok ? (await beforeRes.json().catch(() => []))?.[0] ?? null : null;

  const resetRes = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  if (!resetRes.ok) {
    const detail = await readSupabaseError(resetRes);
    return json(
      { error: `Password reset failed${detail ? ": " + detail : ""}` },
      { status: resetRes.status === 404 ? 404 : 502 },
      headers
    );
  }

  await writeAuditLog(env, authResult.user, {
    action: "user.password_reset",
    target_type: "user",
    target_id: userId,
    before_data: before,
    after_data: {
      email: before?.email ?? null,
      password_generated: !!generatedPassword,
      via: "admin-panel",
    },
  });

  return json(
    {
      ok: true,
      mode: "password-reset",
      userId,
      email: before?.email ?? null,
      generatedPassword,
    },
    { status: 200 },
    headers
  );
}

// Cryptographically secure random password with mixed case, digits, symbols.
function generatePassword(len) {
  const alphabet =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&*-_";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

async function readSupabaseError(res) {
  try {
    const b = await res.json();
    return b?.msg || b?.error_description || b?.error || "";
  } catch {
    return "";
  }
}

async function findAuthUserByEmail(env, service, email) {
  const normalized = email.toLowerCase();
  const perPage = 1000;

  for (let page = 1; page <= 10; page++) {
    const res = await fetch(
      `${env.SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
      { headers: { apikey: service, Authorization: `Bearer ${service}` } }
    );
    if (!res.ok) return null;

    const payload = await res.json().catch(() => null);
    const users = Array.isArray(payload?.users)
      ? payload.users
      : Array.isArray(payload)
        ? payload
        : [];

    const found = users.find((user) => String(user?.email || "").toLowerCase() === normalized);
    if (found) return found;
    if (users.length < perPage) return null;
  }

  return null;
}

function upsertProfile(env, service, profile) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/profiles?on_conflict=id`, {
    method: "POST",
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      updated_at: new Date().toISOString(),
    }),
  });
}

// Best-effort audit log. Doesn't block the response on failure.
async function writeAuditLog(env, actor, entry) {
  const service = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!service) return;
  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/admin_audit_log`, {
      method: "POST",
      headers: {
        apikey: service,
        Authorization: `Bearer ${service}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        actor_id: actor?.id ?? null,
        actor_email: actor?.email ?? null,
        action: entry.action,
        target_type: entry.target_type ?? null,
        target_id: entry.target_id ?? null,
        before_data: entry.before_data ?? null,
        after_data: entry.after_data ?? null,
      }),
    });
  } catch {
    // Audit log is non-critical; swallow errors.
  }
}

async function handleDelete(request, env) {
  const headers = corsHeaders(request, env);

  const authResult = await verifyAdmin(request, env);
  if (!authResult.ok) {
    return json({ error: authResult.error }, { status: authResult.status }, headers);
  }

  const url = new URL(request.url);
  const target = url.searchParams.get("url");
  if (!target) {
    return json({ error: "Missing ?url=" }, { status: 400 }, headers);
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return json({ error: "Invalid URL" }, { status: 400 }, headers);
  }

  const publicHost = new URL(env.PUBLIC_IMAGE_HOST).host;
  if (parsed.host !== publicHost) {
    return json({ error: "URL does not match public image host" }, { status: 400 }, headers);
  }

  // Key = everything after the leading slash. Restrict to events/ prefix.
  const key = parsed.pathname.replace(/^\/+/, "");
  if (!key.startsWith("events/")) {
    return json({ error: "Key outside events/ prefix" }, { status: 400 }, headers);
  }

  await env.IMAGES.delete(key);
  return json({ ok: true, deleted: key }, { status: 200 }, headers);
}
