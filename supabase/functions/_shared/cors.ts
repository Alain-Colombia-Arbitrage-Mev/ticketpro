/**
 * Shared CORS configuration for all Edge Functions
 *
 * Strategy: Access-Control-Allow-Origin: * + Bearer-token auth.
 * Rationale: both veltlix.com and admin.veltlix.com (plus any future CF Pages
 * preview domain) hit the same edge functions. Since all privileged endpoints
 * require a valid Supabase JWT in the Authorization header (auth is the gate),
 * a wildcard CORS origin is safe and avoids having to touch every function
 * when a new frontend host is added.
 *
 * Note: `Access-Control-Allow-Credentials: true` is NOT set, which is required
 * when using `*`. Frontend calls must not rely on cookies — they don't; we use
 * Bearer tokens (supabase.auth.token in localStorage, sent as Authorization).
 */

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey, authorization",
  "Vary": "Origin",
};

/** CORS headers for webhook endpoints (Stripe, Cryptomus) that receive requests from external servers */
export const WEBHOOK_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature, sign, merchant",
};

/** Returns a preflight response for CORS OPTIONS requests */
export function corsResponse(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/** Returns a preflight response for webhook CORS OPTIONS requests */
export function webhookCorsResponse(): Response {
  return new Response(null, { status: 204, headers: WEBHOOK_CORS_HEADERS });
}
