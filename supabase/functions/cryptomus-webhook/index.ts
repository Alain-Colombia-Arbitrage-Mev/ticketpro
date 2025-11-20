/**
 * Supabase Edge Function: Cryptomus Webhook Handler
 * 
 * Maneja webhooks de Cryptomus para procesar pagos con criptomonedas
 * y crear tickets automáticamente cuando un pago es exitoso.
 * 
 * Environment variables necesarias (configurar en Supabase Dashboard):
 *   - CRYPTOMUS_PAYMENT_API_KEY  (Payment API key from Cryptomus Business > Settings)
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 * 
 * Optional:
 *   - CRYPTOMUS_ACCEPT_STATUSES  (comma-separated list of statuses to accept)
 *   - DEBUG_CRYPTOMUS            (set to "1" to include debugging info)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, sign, merchant",
};

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
  payment_status?: string;
  url?: string;
  expired_at?: number;
  is_final?: boolean;
  additional_data?: string | null;
  created_at?: string;
  updated_at?: string;
  sign?: string;
};

// Helper: MD5 implementation
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
    for (i = 0; i < s.length; i++)
      tail[i >> 2] |= s.charCodeAt(i) << (i % 4 << 3);
    tail[i >> 2] |= 0x80 << (i % 4 << 3);
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

function base64Encode(str: string): string {
  const utf8 = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_m, p1) =>
    String.fromCharCode(parseInt(p1, 16)),
  );
  return btoa(utf8);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function randomCode(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function randomPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }

  try {
    // Obtener configuración
    const apiKey = Deno.env.get("CRYPTOMUS_PAYMENT_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const acceptStatuses = Deno.env.get("CRYPTOMUS_ACCEPT_STATUSES") || 
      "paid,paid_over,confirming,check,wrong_amount,cancel,fail";
    const debug = Deno.env.get("DEBUG_CRYPTOMUS") === "1";

    if (!apiKey) {
      console.error("Missing CRYPTOMUS_PAYMENT_API_KEY");
      return new Response(
        JSON.stringify({ ok: false, error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    // Leer body
    const bodyText = await req.text();
    const receivedSign = req.headers.get("sign") || "";
    const merchantHeader = req.headers.get("merchant") || "";

    // Verificar firma
    const bodyB64 = base64Encode(bodyText);
    const computedSign = md5Hex(bodyB64 + apiKey);
    const signatureValid = timingSafeEqual(
      receivedSign.trim().toLowerCase(),
      computedSign.toLowerCase(),
    );

    if (!signatureValid) {
      console.warn("[Cryptomus] Invalid signature", {
        receivedSign,
        computedSign,
        merchantHeader,
      });
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid signature" }),
        { status: 401, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    // Parsear payload
    let payload: CryptomusWebhookBody | null = null;
    try {
      payload = bodyText ? (JSON.parse(bodyText) as CryptomusWebhookBody) : null;
    } catch (e) {
      console.error("[Cryptomus] Failed to parse body:", e);
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid JSON" }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    const orderId = payload?.order_id || "";
    const status = payload?.payment_status || "unknown";
    const uuid = payload?.uuid || "";
    const txid = payload?.txid || null;

    // Verificar status permitido
    const allowedStatuses = acceptStatuses.split(",").map((s) => s.trim().toLowerCase());
    const isAllowed = allowedStatuses.includes(status.toLowerCase());

    if (!isAllowed) {
      console.warn("[Cryptomus] Ignoring unsupported status", { orderId, status });
      return new Response(
        JSON.stringify({ ok: true, ignored: true, orderId, status }),
        { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    // Fulfillment de tickets cuando el pago fue exitoso
    if (status === "paid" || status === "paid_over") {
      if (!supabaseUrl || !supabaseServiceKey) {
        console.warn("[Cryptomus] Supabase credentials not found, skipping fulfillment");
      } else {
        try {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          const origin = new URL(req.url).origin;

          // Parsear additional_data
          let additional: any = null;
          if (payload && typeof payload.additional_data === "string") {
            try {
              additional = JSON.parse(payload.additional_data);
            } catch {
              additional = null;
            }
          } else if (payload?.additional_data && typeof payload.additional_data === "object") {
            additional = payload.additional_data;
          }

          // Obtener items de compra
          const ticketItems: any[] = [];
          if (additional?.items && Array.isArray(additional.items)) {
            ticketItems.push(...additional.items);
          }
          if (additional?.tickets && Array.isArray(additional.tickets)) {
            ticketItems.push(...additional.tickets);
          }
          if (additional?.cart && Array.isArray(additional.cart)) {
            ticketItems.push(...additional.cart);
          }

          if (ticketItems.length > 0) {
            // Expandir por cantidad
            const expanded: any[] = [];
            for (const item of ticketItems) {
              const qty = Math.max(1, Number(item.quantity || 1));
              for (let i = 0; i < qty; i++) {
                expanded.push(item);
              }
            }

            // Crear registros de tickets
            const nowIso = new Date().toISOString();
            const purchaseSummaryBase = {
              cryptomus: {
                uuid,
                txid,
                payment_status: payload.payment_status,
                payer_currency: payload.payer_currency,
                currency: payload.currency,
                amount: payload.amount,
                payment_amount: payload.payment_amount,
              },
              purchaseDate: nowIso,
              paymentMethod: "crypto",
              orderId,
            };

            const records = expanded.map((it) => {
              const ticketCode = randomCode(12);
              const pin = randomPin();
              const tempId = crypto.randomUUID();

              return {
                ticket_code: ticketCode,
                qr_code: `${origin}/#validate-ticket?ticketId=${tempId}&code=${ticketCode}`,
                status: "issued_unused",
                event_id: it.eventId ?? it.event_id ?? 0,
                event_name: it.eventName ?? it.event_name ?? "Evento",
                event_date: it.eventDate ?? it.event_date ?? nowIso.split("T")[0],
                event_time: it.eventTime ?? it.event_time ?? null,
                event_location: it.eventLocation ?? it.event_location ?? null,
                event_category: it.eventCategory ?? it.event_category ?? null,
                buyer_email: it.buyerEmail ?? it.buyer_email ?? null,
                buyer_full_name: it.buyerFullName ?? it.buyer_full_name ?? null,
                buyer_address: it.buyerAddress ?? it.buyer_address ?? null,
                ticket_type: it.ticketType ?? it.ticket_type ?? null,
                seat_type: it.seatType ?? it.seat_type ?? "numerado",
                ticket_class: it.ticketClass ?? it.ticket_class ?? it.ticketType ?? "General",
                price: Number(it.price ?? additional?.amount ?? 0),
                price_paid: Number(it.price ?? additional?.amount ?? 0),
                payment_method_id: "crypto",
                purchase_id: orderId,
                purchase_summary: purchaseSummaryBase,
                pin,
                metadata: {
                  source: "cryptomus_webhook",
                  pin_generated_at: nowIso,
                },
              };
            });

            // Insertar tickets
            const { data: insertedTickets, error: insertError } = await supabase
              .from("tickets")
              .insert(records)
              .select();

            if (insertError) {
              console.error("[Cryptomus] Failed to insert tickets:", insertError);
            } else if (insertedTickets && insertedTickets.length > 0) {
              // Actualizar QR codes con IDs reales
              for (const ticket of insertedTickets) {
                const finalQrCode = `${origin}/#validate-ticket?ticketId=${ticket.id}&code=${ticket.ticket_code}`;
                await supabase
                  .from("tickets")
                  .update({ qr_code: finalQrCode, updated_at: nowIso })
                  .eq("id", ticket.id);
              }
              console.log(`[Cryptomus] Created ${insertedTickets.length} tickets for order ${orderId}`);

              // Enviar comprobante de compra por email
              const buyerEmail = additional?.buyerEmail ?? additional?.buyer_email;
              const buyerName = additional?.buyerFullName ?? additional?.buyer_full_name ?? 'Cliente';
              
              if (buyerEmail) {
                try {
                  const receiptResponse = await fetch(
                    `${supabaseUrl}/functions/v1/send-purchase-receipt`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                      },
                      body: JSON.stringify({
                        orderId,
                        customerEmail: buyerEmail,
                        customerName: buyerName,
                      }),
                    }
                  );

                  if (receiptResponse.ok) {
                    console.log(`[Cryptomus] Comprobante enviado a ${buyerEmail} para orden ${orderId}`);
                  } else {
                    console.warn(`[Cryptomus] No se pudo enviar comprobante: ${await receiptResponse.text()}`);
                  }
                } catch (emailError) {
                  console.warn('[Cryptomus] Error enviando comprobante:', emailError);
                  // No fallar el webhook si el email falla
                }
              }
            }
          }
        } catch (e) {
          console.error("[Cryptomus] Error fulfilling tickets:", e);
        }
      }
    }

    console.log("[Cryptomus] Webhook processed", { orderId, status, uuid, txid });

    return new Response(
      JSON.stringify({
        ok: true,
        orderId,
        status,
        uuid,
        txid,
        ...(debug ? {
          _debug: {
            receivedSign,
            computedSign,
            bodyB64Length: bodyB64.length,
            merchantHeader,
          },
        } : {}),
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  } catch (error) {
    console.error("[Cryptomus] Webhook handler error:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }
});



