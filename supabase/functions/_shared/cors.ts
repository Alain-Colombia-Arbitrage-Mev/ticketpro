/**
 * Shared CORS configuration for all Edge Functions.
 * Authenticated functions rely on Bearer-token auth, not cookies, so wildcard
 * origin is safe as long as Access-Control-Allow-Credentials is not set.
 */
export function corsHeaders(_req?: Request) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, x-application-name, apikey, content-type, x-supabase-api-version, accept, accept-profile, content-profile, prefer",
  };
}

export const CORS_HEADERS = corsHeaders();
/** CORS headers for webhook endpoints (Stripe, Cryptomus) that receive requests from external servers */ export const WEBHOOK_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature, sign, merchant"
};
/** Returns a preflight response for CORS OPTIONS requests */ export function corsResponse(_req?: Request) {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
}
/** Returns a preflight response for webhook CORS OPTIONS requests */ export function webhookCorsResponse() {
  return new Response(null, {
    status: 204,
    headers: WEBHOOK_CORS_HEADERS
  });
}
