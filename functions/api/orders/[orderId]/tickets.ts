/**
 * Cloudflare Pages Function: List tickets by orderId
 *
 * Path:
 *   /api/orders/[orderId]/tickets
 *
 * Description:
 *   Returns tickets associated with a given purchase/order ID.
 *   Intended to be used by the frontend to poll for availability after a crypto payment is confirmed.
 *
 * Environment variables required (configure in Cloudflare Pages project):
 *   - SUPABASE_URL            (e.g. https://<project-id>.supabase.co)
 *   - SUPABASE_SERVICE_ROLE   (Supabase service role key; DO NOT expose in frontend)
 *
 * Notes:
 *   - This endpoint filters out sensitive fields (e.g., pin, metadata).
 *   - CORS is enabled for GET and OPTIONS requests.
 */

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
  // Fallbacks if someone used VITE_* by error in the Pages env (not recommended, but we try to be resilient)
  VITE_SUPABASE_PROJECT_URL?: string;
  VITE_supabase_project_url?: string;
  VITE_SUPABASE_SERVICE_ROLE?: string;
  VITE_supabase_service_role?: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { env, params, request } = context;

    // Resolve environment configuration
    const supabaseUrl =
      env.SUPABASE_URL ||
      env.VITE_SUPABASE_PROJECT_URL ||
      env.VITE_supabase_project_url;

    const serviceRole =
      env.SUPABASE_SERVICE_ROLE ||
      env.VITE_SUPABASE_SERVICE_ROLE ||
      env.VITE_supabase_service_role;

    if (!supabaseUrl || !serviceRole) {
      return json(
        {
          ok: false,
          error:
            "Server not configured: missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE",
        },
        500,
      );
    }

    // Order ID from route param or querystring fallback
    const url = new URL(request.url);
    const orderIdFromPath = (params?.orderId as string | undefined) || "";
    const orderIdFromQuery = url.searchParams.get("orderId") || "";
    const orderId = (orderIdFromPath || orderIdFromQuery).trim();

    if (!orderId) {
      return json(
        {
          ok: false,
          error: "Missing orderId",
        },
        400,
      );
    }

    // Select only non-sensitive fields
    // Excludes: pin, metadata, (optionally) validation_code
    const selectColumns = [
      "id",
      "ticket_code",
      "qr_code",
      "status",
      "event_id",
      "event_name",
      "event_date",
      "event_time",
      "event_location",
      "event_category",
      // Buyer info can be sensitive; omit unless needed
      // "buyer_email",
      // "buyer_full_name",
      "ticket_type",
      "seat_number",
      "seat_type",
      "gate_number",
      "ticket_class",
      "ticket_category_id",
      "price",
      "price_paid",
      "payment_method_id",
      "purchase_id",
      "purchase_date",
      "used_at",
      "used_by",
      "created_at",
      "updated_at",
    ].join(",");

    const endpoint = `${supabaseUrl}/rest/v1/tickets?purchase_id=eq.${encodeURIComponent(
      orderId,
    )}&select=${encodeURIComponent(selectColumns)}`;

    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${serviceRole}`,
        apikey: serviceRole,
        "Content-Type": "application/json",
        Prefer: "count=exact",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return json(
        {
          ok: false,
          orderId,
          error: "Failed to fetch tickets from Supabase",
          details: errText,
        },
        res.status,
      );
    }

    const tickets = (await res.json()) as unknown[];

    return json(
      {
        ok: true,
        orderId,
        count: Array.isArray(tickets) ? tickets.length : 0,
        tickets: Array.isArray(tickets) ? tickets : [],
      },
      200,
    );
  } catch (error: any) {
    return json(
      {
        ok: false,
        error: "Unexpected server error",
        message: error?.message || String(error),
      },
      500,
    );
  }
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}
