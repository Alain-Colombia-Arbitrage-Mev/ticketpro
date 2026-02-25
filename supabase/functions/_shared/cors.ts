/**
 * Shared CORS configuration for all Edge Functions
 * Restricts origin to the production frontend URL
 */

const ALLOWED_ORIGIN = Deno.env.get("FRONTEND_URL") || "https://veltlix.com";

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey, authorization",
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
