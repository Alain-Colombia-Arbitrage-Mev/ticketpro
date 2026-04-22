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
const MAX_BYTES = 10 * 1024 * 1024; // 10MB per file
const VALID_VARIANTS = new Set(["slider", "card", "detail"]);
const VALID_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === UPLOAD_PATH) {
      if (request.method === "DELETE") return handleDelete(request, env);
      return handleUpload(request, env);
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
    "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
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
