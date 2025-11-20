/**
 * Supabase Edge Function: Create Cryptomus Invoice
 * 
 * Crea una factura/invoice en Cryptomus para pagos con criptomonedas.
 * La API Key nunca se expone al frontend.
 * 
 * Environment variables necesarias (configurar en Supabase Dashboard):
 *   - CRYPTOMUS_PAYMENT_API_KEY  (Payment API key from Cryptomus Business > Settings)
 *   - CRYPTOMUS_MERCHANT_ID       (Merchant UUID from Cryptomus Business)
 *   - FRONTEND_URL                (URL del frontend para redirecciones)
 *   - SUPABASE_URL                (Para webhooks)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface CreateInvoiceRequest {
  amount: number;
  currency?: string;
  orderId: string;
  toCurrency?: string;
  network?: string;
  items?: any[];
  buyerEmail?: string;
  buyerFullName?: string;
  buyerAddress?: string;
  successUrl?: string;
  cancelUrl?: string;
}

interface CryptomusInvoiceRequest {
  amount: string;
  currency: string;
  order_id: string;
  url_callback?: string;
  url_return?: string;
  url_success?: string;
  lifetime?: number;
  to_currency?: string;
  network?: string;
  is_payment_multiple?: boolean;
  additional_data?: string;
}

/**
 * Genera la firma MD5 para autenticar con Cryptomus
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
    const s = '0123456789abcdef';
    let j;
    let out = '';
    for (j = 0; j < 4; j++)
      out +=
        s.charAt((n >> (j * 8 + 4)) & 0x0f) + s.charAt((n >> (j * 8)) & 0x0f);
    return out;
  }
  function hex(x: number[]) {
    for (let i = 0; i < x.length; i++) x[i] = rhex(x[i]) as unknown as number;
    return (x as unknown as string[]).join('');
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

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }

  try {
    // Obtener configuración
    const apiKey = Deno.env.get('CRYPTOMUS_PAYMENT_API_KEY');
    const merchantId = Deno.env.get('CRYPTOMUS_MERCHANT_ID') || Deno.env.get('VITE_CRYPTOMUS_MERCHANT_ID'); // UUID del merchant
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:3002';

    if (!apiKey || !merchantId) {
      console.error('❌ Missing Cryptomus credentials');
      console.error(`   API Key: ${apiKey ? 'Set' : 'Missing'}`);
      console.error(`   Merchant ID: ${merchantId ? 'Set' : 'Missing'}`);
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          details: 'CRYPTOMUS_PAYMENT_API_KEY or CRYPTOMUS_MERCHANT_ID not configured'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    // Parse request body
    const body: CreateInvoiceRequest = await req.json();
    const {
      amount,
      currency = 'USD',
      orderId,
      toCurrency = 'USDT',
      network,
      items = [],
      buyerEmail,
      buyerFullName,
      buyerAddress,
      successUrl,
      cancelUrl,
    } = body;

    if (!amount || !orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: amount, orderId' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    console.log(`📧 Creating Cryptomus invoice for order ${orderId}`);
    console.log(`   Amount: ${amount} ${currency} → ${toCurrency}`);
    console.log(`   Buyer: ${buyerEmail}`);

    // URL del webhook
    const callbackUrl = `${supabaseUrl}/functions/v1/cryptomus-webhook`;

    // URLs de retorno
    const finalSuccessUrl = successUrl || `${frontendUrl}/#/confirmation?order_id=${orderId}`;
    const finalCancelUrl = cancelUrl || `${frontendUrl}/#/checkout?canceled=true`;

    // Preparar additional_data con items y buyer info
    const additionalData = JSON.stringify({
      items,
      buyerEmail,
      buyerFullName,
      buyerAddress,
      orderId,
    });

    // Construir request para Cryptomus
    const cryptomusRequest: CryptomusInvoiceRequest = {
      amount: amount.toFixed(2),
      currency: currency.toUpperCase(),
      order_id: orderId,
      to_currency: toCurrency.toUpperCase(),
      network: network,
      url_callback: callbackUrl,
      url_return: finalCancelUrl,
      url_success: finalSuccessUrl,
      lifetime: 3600, // 1 hora
      is_payment_multiple: true,
      additional_data: additionalData,
    };

    // Firmar request
    const requestBody = JSON.stringify(cryptomusRequest);
    const bodyB64 = base64Encode(requestBody);
    const signature = md5Hex(bodyB64 + apiKey);

    console.log(`🔐 Request signature generated`);
    console.log(`   Callback URL: ${callbackUrl}`);

    // Llamar a Cryptomus API
    // Según documentación: https://doc.cryptomus.com/es/methods/request-format
    const cryptomusResponse = await fetch('https://api.cryptomus.com/v1/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'merchant': merchantId, // UUID del merchant
        'sign': signature,      // MD5(base64(body) + API_KEY)
      },
      body: requestBody,
    });

    const responseData = await cryptomusResponse.json();

    if (!cryptomusResponse.ok || responseData.state !== 0) {
      console.error('❌ Cryptomus API error:', responseData);
      return new Response(
        JSON.stringify({
          error: 'Cryptomus API error',
          details: responseData.message || 'Unknown error',
          cryptomusError: responseData,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    console.log(`✅ Invoice created successfully`);
    console.log(`   UUID: ${responseData.result?.uuid}`);
    console.log(`   Payment URL: ${responseData.result?.url}`);
    console.log(`   Status: ${responseData.result?.payment_status}`);

    return new Response(
      JSON.stringify({
        success: true,
        invoice: responseData.result,
        paymentUrl: responseData.result?.url,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );

  } catch (error) {
    console.error('❌ Error creating Cryptomus invoice:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }
});

