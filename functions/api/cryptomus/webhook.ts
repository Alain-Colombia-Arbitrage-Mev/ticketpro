/**
 * Cryptomus Webhook Endpoint (Cloudflare Pages Functions)
 *
 * Path:
 *   /api/cryptomus/webhook
 *
 * Purpose:
 *   - Receives payment status notifications from Cryptomus
 *   - Verifies the webhook signature using your Cryptomus Payment API key
 *   - Returns HTTP 200 on success so Cryptomus marks webhook as delivered
 *
 * Environment variables required (set in Cloudflare Pages Project Settings):
 *   - CRYPTOMUS_PAYMENT_API_KEY  (Payment API key from Cryptomus Business > Settings)
 *
 * Optional environment variables:
 *   - CRYPTOMUS_ACCEPT_STATUSES  (comma-separated list of statuses to accept; defaults to: paid,paid_over,confirming,check,wrong_amount,cancel,fail)
 *   - DEBUG_CRYPTOMUS            (set to "1" to include debugging info in response body)
 */

type CryptomusWebhookBody = {
  uuid?: string;
  order_id?: string;
  amount?: string;
  payment_amount?: string;
  payer_amount?: string;
  payer_currency?: string;
  currency?: string;
  merchant_amount?: string;
  network?: string;
  address?: string;
  from?: string;
  txid?: string | null;
  payment_status?: string; // e.g., "paid", "paid_over", "confirming", "wrong_amount", "cancel", "fail", "check"
  url?: string;
  expired_at?: number;
  is_final?: boolean;
  additional_data?: string | null;
  created_at?: string;
  updated_at?: string;
  // sign may be included in body for some testing endpoints, but we always read it from the header
  sign?: string;
};

interface Env {
  CRYPTOMUS_PAYMENT_API_KEY?: string;
  CRYPTOMUS_ACCEPT_STATUSES?: string;
  DEBUG_CRYPTOMUS?: string;
}

/**
 * Minimal MD5 implementation (hex output) in TypeScript.
 * Based on public-domain reference implementation.
 */
function md5Hex(input: string): string {
  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & d) | (c & ~b), a, b, x, s, t);
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function md51(s: string) {
    const n = s.length;
    const state = [1732584193, -271733879, -1732584194, 271733878];
    let i: number;
    for (i = 64; i <= n; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);
    const tail = new Array(16).fill(0);
    for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) {
      md5cycle(state, tail);
      for (i = 0; i < 16; i++) tail[i] = 0;
    }
    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }
  function md5cycle(x: number[], k: number[]) {
    let [a, b, c, d] = x;
    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);

    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);

    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);

    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);

    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);
  }
  function md5blk(s: string) {
    const md5blks = new Array(16);
    for (let i = 0; i < 64; i += 4) {
      md5blks[i >> 2] =
        s.charCodeAt(i) +
        (s.charCodeAt(i + 1) << 8) +
        (s.charCodeAt(i + 2) << 16) +
        (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  }
  function rhex(n: number) {
    const s = "0123456789abcdef";
    let j;
    let out = "";
    for (j = 0; j < 4; j++)
      out +=
        s.charAt((n >> (j * 8 + 4)) & 0x0f) + s.charAt((n >> (j * 8)) & 0x0f);
    return out;
  }
  function hex(x: number[]) {
    for (let i = 0; i < x.length; i++) x[i] = rhex(x[i]) as unknown as number;
    return (x as unknown as string[]).join("");
  }
  function add32(a: number, b: number) {
    return (a + b) & 0xffffffff;
  }
  return hex(md51(input));
}

/**
 * Base64-encode a string in a Unicode-safe way for Workers
 */
function base64Encode(str: string): string {
  // Handle unicode properly
  const utf8 = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_m, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  );
  // btoa expects binary string
  // eslint-disable-next-line no-undef
  return btoa(utf8);
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const apiKey = env.CRYPTOMUS_PAYMENT_API_KEY || "";
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Server not configured: missing CRYPTOMUS_PAYMENT_API_KEY",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Read raw body text for exact signature calculation
  const bodyText = await request.text();

  // Headers
  const receivedSign = request.headers.get("sign") || "";
  const merchantHeader = request.headers.get("merchant") || "";

  // Compute signature: sign = md5( base64(body) + api_key )
  const bodyB64 = base64Encode(bodyText);
  const computedSign = md5Hex(bodyB64 + apiKey);

  const signatureValid = timingSafeEqual(
    receivedSign.trim().toLowerCase(),
    computedSign.toLowerCase()
  );

  // Parse JSON after signature work (we already consumed request body)
  let payload: CryptomusWebhookBody | null = null;
  try {
    payload = bodyText ? (JSON.parse(bodyText) as CryptomusWebhookBody) : null;
  } catch (_e) {
    // Ignore parsing error for invalid JSON, still handle signature failure
  }

  if (!signatureValid) {
    // For debugging: log computed and received (but do not leak API key!)
    console.warn("[Cryptomus] Invalid signature", {
      receivedSign,
      computedSign,
      merchantHeader,
      bodyPreview: bodyText.slice(0, 256),
    });
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Invalid signature",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Extract fields
  const orderId = payload?.order_id || "";
  const status = payload?.payment_status || "unknown";
  const uuid = payload?.uuid || "";
  const txid = payload?.txid || null;
  const amount = payload?.amount || null;
  const currency = payload?.currency || null;
  const payerCurrency = payload?.payer_currency || null;

  // Optionally filter accepted statuses
  const allowedStatuses =
    (env.CRYPTOMUS_ACCEPT_STATUSES || "paid,paid_over,confirming,check,wrong_amount,cancel,fail")
      .split(",")
      .map((s) => s.trim().toLowerCase());

  const isAllowed = allowedStatuses.includes(status.toLowerCase());

  if (!isAllowed) {
    console.warn("[Cryptomus] Ignoring unsupported status", {
      orderId,
      status,
    });
    // Still return 200 so Cryptomus doesn't retry forever
    return new Response(
      JSON.stringify({ ok: true, ignored: true, orderId, status }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // TODO: Integrate with your business logic here:
  // - Mark payment as paid/confirmed in your database
  // - Generate tickets or unlock the purchase
  // - Send emails/notifications
  //
  // Example (pseudo-code):
  // await db.updatePayment({ orderId, status, uuid, txid, amount, currency, payerCurrency });
  // if (status === 'paid' || status === 'paid_over') await fulfillOrder(orderId);

  console.log("[Cryptomus] Webhook processed", {
    orderId,
    status,
    uuid,
    txid,
    amount,
    currency,
    payerCurrency,
    merchantHeader,
  });

  const debug = env.DEBUG_CRYPTOMUS === "1";
  return new Response(
    JSON.stringify({
      ok: true,
      orderId,
      status,
      uuid,
      txid,
      ...(debug
        ? {
            _debug: {
              receivedSign,
              computedSign,
              bodyB64Length: bodyB64.length,
              merchantHeader,
            },
          }
        : {}),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};

// Optional: handle other methods with 405
export const onRequest: PagesFunction = async ({ request }) => {
  if (request.method.toUpperCase() !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }
  // Let onRequestPost handle POST
  return new Response("OK", { status: 200 });
};
