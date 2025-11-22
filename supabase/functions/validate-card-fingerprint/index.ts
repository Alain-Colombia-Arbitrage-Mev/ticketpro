import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ValidateCardRequest {
  fingerprint: string;
  buyer_email: string;
  buyer_name?: string;
  last4?: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
}

interface CardFingerprintRecord {
  id: string;
  fingerprint: string;
  buyer_email: string;
  buyer_name: string | null;
  last4: string | null;
  brand: string | null;
  first_used_at: string;
  last_used_at: string;
  use_count: number;
  is_blocked: boolean;
  blocked_reason: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Crear cliente de Supabase con service_role key (bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const requestData: ValidateCardRequest = await req.json();
    const { fingerprint, buyer_email, buyer_name, last4, brand, exp_month, exp_year } = requestData;

    // Validar parámetros requeridos
    if (!fingerprint || !buyer_email) {
      return new Response(
        JSON.stringify({
          success: false,
          allowed: false,
          message: "Fingerprint y buyer_email son requeridos",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`🔍 Validando fingerprint: ${fingerprint} para email: ${buyer_email}`);

    // Buscar todos los registros con este fingerprint
    const { data: existingRecords, error: searchError } = await supabaseAdmin
      .from("card_fingerprints")
      .select("*")
      .eq("fingerprint", fingerprint)
      .order("first_used_at", { ascending: true });

    if (searchError) {
      console.error("❌ Error buscando fingerprint:", searchError);
      throw searchError;
    }

    // CASO 1: Fingerprint nunca usado antes
    if (!existingRecords || existingRecords.length === 0) {
      console.log("✅ Nueva tarjeta, creando registro...");
      
      const { error: insertError } = await supabaseAdmin
        .from("card_fingerprints")
        .insert({
          fingerprint,
          buyer_email: buyer_email.toLowerCase(),
          buyer_name,
          last4,
          brand,
          exp_month,
          exp_year,
          use_count: 1,
          is_blocked: false,
          metadata: {
            first_transaction_date: new Date().toISOString(),
          },
        });

      if (insertError) {
        console.error("❌ Error insertando fingerprint:", insertError);
        throw insertError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          allowed: true,
          message: "Tarjeta nueva, permitida",
          is_new_card: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // CASO 2: Fingerprint existe - verificar si es el mismo comprador
    const normalizedEmail = buyer_email.toLowerCase();
    const sameUserRecord = existingRecords.find(
      (record: CardFingerprintRecord) => record.buyer_email.toLowerCase() === normalizedEmail
    );

    if (sameUserRecord) {
      // Mismo usuario usando su propia tarjeta
      console.log(`✅ Mismo usuario (${buyer_email}) usando su tarjeta`);

      // Verificar si está bloqueada
      if (sameUserRecord.is_blocked) {
        return new Response(
          JSON.stringify({
            success: true,
            allowed: false,
            blocked: true,
            message: `Esta tarjeta ha sido bloqueada. Razón: ${sameUserRecord.blocked_reason || "Actividad sospechosa"}`,
            reason: sameUserRecord.blocked_reason,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Actualizar use_count y last_used_at
      const { error: updateError } = await supabaseAdmin
        .from("card_fingerprints")
        .update({
          use_count: sameUserRecord.use_count + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", sameUserRecord.id);

      if (updateError) {
        console.warn("⚠️ Error actualizando use_count:", updateError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          allowed: true,
          message: "Tarjeta verificada, mismo titular",
          use_count: sameUserRecord.use_count + 1,
          first_used_at: sameUserRecord.first_used_at,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // CASO 3: Fingerprint existe pero con DIFERENTE email - BLOQUEAR
    const otherUserRecord = existingRecords[0];
    console.log(`🚨 FRAUDE DETECTADO: Tarjeta (...${last4}) ya usada por: ${otherUserRecord.buyer_email}`);

    return new Response(
      JSON.stringify({
        success: true,
        allowed: false,
        fraud_detected: true,
        message: "Esta tarjeta ya ha sido registrada por otro usuario. Por seguridad, no podemos procesar esta transacción.",
        details: {
          last4,
          brand,
          first_used_by: otherUserRecord.buyer_email.replace(/(.{3})(.*)(@.*)/, "$1***$3"), // Ofuscar email
          first_used_at: otherUserRecord.first_used_at,
        },
      }),
      {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ Error en validate-card-fingerprint:", error);
    return new Response(
      JSON.stringify({
        success: false,
        allowed: false,
        message: "Error al validar tarjeta",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

