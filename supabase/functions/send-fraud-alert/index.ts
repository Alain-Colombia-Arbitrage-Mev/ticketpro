import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FraudAlertRequest {
  fingerprint: string;
  current_buyer_email: string;
  current_buyer_name?: string;
  original_buyer_email: string;
  original_buyer_name?: string;
  card_last4: string;
  card_brand: string;
  order_id: string;
  session_id?: string;
  amount: number;
  currency: string;
  original_first_used?: string;
  alert_type: "warning" | "blocked";
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const alertData: FraudAlertRequest = await req.json();
    
    const {
      fingerprint,
      current_buyer_email,
      current_buyer_name,
      original_buyer_email,
      original_buyer_name,
      card_last4,
      card_brand,
      order_id,
      session_id,
      amount,
      currency,
      original_first_used,
      alert_type,
    } = alertData;

    console.log(`🚨 Enviando alerta de fraude: ${alert_type} para orden ${order_id}`);

    // Formatear fecha
    const now = new Date();
    const dateStr = now.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Los_Angeles",
    });

    const originalDate = original_first_used
      ? new Date(original_first_used).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Los_Angeles",
        })
      : "Desconocida";

    // Determinar nivel de alerta
    const alertLevel = alert_type === "blocked" ? "🔴 CRÍTICA - BLOQUEADA AUTOMÁTICAMENTE" : "🟡 ADVERTENCIA";
    const alertColor = alert_type === "blocked" ? "#dc2626" : "#eab308";
    const alertBg = alert_type === "blocked" ? "#fee2e2" : "#fef3c7";

    // Construir HTML del email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerta de Fraude - Veltlix</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${alertColor} 0%, #991b1b 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                🚨 ALERTA DE POSIBLE FRAUDE
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.95;">
                Sistema de Prevención de Fraude - Veltlix
              </p>
            </td>
          </tr>

          <!-- Alert Level -->
          <tr>
            <td style="padding: 20px 40px; background-color: ${alertBg}; border-left: 4px solid ${alertColor};">
              <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: bold;">
                ${alertLevel}
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; font-weight: bold;">
                Detección de Uso de Tarjeta por Múltiples Usuarios
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; line-height: 1.6;">
                Se ha detectado que la misma tarjeta de crédito/débito está siendo utilizada por diferentes usuarios. 
                Esto puede indicar:
              </p>

              <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #4b5563; line-height: 1.8;">
                <li><strong>Fraude:</strong> Uso de tarjeta robada o clonada</li>
                <li><strong>Uso legítimo:</strong> Familiar pagando por otro miembro</li>
                <li><strong>Uso legítimo:</strong> Secretaria/asistente comprando para jefe</li>
              </ul>

              <!-- Transaction Details -->
              <div style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px; font-weight: bold; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                  📊 Detalles de la Transacción Actual
                </h3>
                
                <table width="100%" cellpadding="8" cellspacing="0">
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; width: 40%;"><strong>Orden ID:</strong></td>
                    <td style="color: #1f2937; font-size: 14px; font-family: monospace;">${order_id}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;"><strong>Comprador:</strong></td>
                    <td style="color: #1f2937; font-size: 14px;">${current_buyer_name || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;"><strong>Email:</strong></td>
                    <td style="color: #1f2937; font-size: 14px;">${current_buyer_email}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;"><strong>Tarjeta:</strong></td>
                    <td style="color: #1f2937; font-size: 14px;">${card_brand.toUpperCase()} **** ${card_last4}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;"><strong>Monto:</strong></td>
                    <td style="color: #1f2937; font-size: 14px; font-weight: bold;">$${(amount / 100).toFixed(2)} ${currency.toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;"><strong>Fecha:</strong></td>
                    <td style="color: #1f2937; font-size: 14px;">${dateStr}</td>
                  </tr>
                </table>
              </div>

              <!-- Original User Details -->
              <div style="background-color: #fef3c7; border-radius: 6px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <h3 style="margin: 0 0 15px 0; color: #92400e; font-size: 16px; font-weight: bold;">
                  ⚠️ Usuario Original de la Tarjeta
                </h3>
                
                <table width="100%" cellpadding="8" cellspacing="0">
                  <tr>
                    <td style="color: #92400e; font-size: 14px; width: 40%;"><strong>Comprador:</strong></td>
                    <td style="color: #78350f; font-size: 14px;">${original_buyer_name || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="color: #92400e; font-size: 14px;"><strong>Email:</strong></td>
                    <td style="color: #78350f; font-size: 14px;">${original_buyer_email}</td>
                  </tr>
                  <tr>
                    <td style="color: #92400e; font-size: 14px;"><strong>Primera vez usado:</strong></td>
                    <td style="color: #78350f; font-size: 14px;">${originalDate}</td>
                  </tr>
                </table>
              </div>

              <!-- Technical Details -->
              <div style="background-color: #f3f4f6; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #4b5563; font-size: 14px; font-weight: bold;">
                  🔍 Información Técnica
                </h3>
                <p style="margin: 0; color: #6b7280; font-size: 12px; font-family: monospace; word-break: break-all;">
                  <strong>Fingerprint:</strong> ${fingerprint}<br>
                  ${session_id ? `<strong>Session ID:</strong> ${session_id}` : ""}
                </p>
              </div>

              ${alert_type === "blocked" ? `
              <!-- Blocked Notice -->
              <div style="background-color: #fee2e2; border-radius: 6px; padding: 20px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <h3 style="margin: 0 0 10px 0; color: #991b1b; font-size: 16px; font-weight: bold;">
                  🔴 TRANSACCIÓN BLOQUEADA AUTOMÁTICAMENTE
                </h3>
                <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                  Esta transacción ha sido <strong>bloqueada automáticamente</strong> y se ha emitido un <strong>reembolso completo</strong> 
                  por el sistema de prevención de fraude. Los tickets han sido cancelados.
                </p>
              </div>
              ` : `
              <!-- Warning Notice -->
              <div style="background-color: #fef3c7; border-radius: 6px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px; font-weight: bold;">
                  🟡 TRANSACCIÓN PERMITIDA CON ADVERTENCIA
                </h3>
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  Esta transacción ha sido <strong>permitida</strong> pero requiere <strong>revisión manual</strong>. 
                  Si determina que es fraude, puede reembolsar y cancelar manualmente desde el panel de Stripe.
                </p>
              </div>
              `}

              <!-- Action Required -->
              <div style="margin: 30px 0 20px 0; padding: 20px; background-color: #f0f9ff; border-radius: 6px; border-left: 4px solid #0284c7;">
                <h3 style="margin: 0 0 15px 0; color: #075985; font-size: 16px; font-weight: bold;">
                  ✅ Acción Requerida
                </h3>
                <ol style="margin: 0; padding-left: 20px; color: #0c4a6e; line-height: 1.8;">
                  <li>Revisar la transacción en el <a href="https://dashboard.stripe.com" style="color: #0284c7; text-decoration: none; font-weight: bold;">Dashboard de Stripe</a></li>
                  <li>Verificar si los emails coinciden con la misma persona/familia</li>
                  <li>Contactar al comprador actual para confirmar si es uso legítimo</li>
                  <li>Si es fraude confirmado: Reembolsar y bloquear manualmente</li>
                  <li>Si es legítimo: Registrar en whitelist para futuras compras</li>
                </ol>
              </div>

              <!-- Quick Links -->
              <div style="margin: 20px 0; text-align: center;">
                <a href="https://supabase.com/dashboard/project/***REMOVED***/editor" 
                   style="display: inline-block; margin: 5px; padding: 12px 24px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
                  Ver en Supabase
                </a>
                <a href="https://dashboard.stripe.com/payments" 
                   style="display: inline-block; margin: 5px; padding: 12px 24px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
                  Ver en Stripe
                </a>
                <a href="https://veltlix.com" 
                   style="display: inline-block; margin: 5px; padding: 12px 24px; background-color: #c61619; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
                  Ver Sitio Web
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px;">
                Este es un email automático del Sistema de Prevención de Fraude
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                Veltlix © ${now.getFullYear()} | Sistema Anti-Fraude v2.0
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    // Email en texto plano (fallback)
    const emailText = `
🚨 ALERTA DE POSIBLE FRAUDE - ${alertLevel}

Se ha detectado que la misma tarjeta está siendo utilizada por diferentes usuarios.

TRANSACCIÓN ACTUAL:
- Orden ID: ${order_id}
- Comprador: ${current_buyer_name || "N/A"} (${current_buyer_email})
- Tarjeta: ${card_brand.toUpperCase()} **** ${card_last4}
- Monto: $${(amount / 100).toFixed(2)} ${currency.toUpperCase()}
- Fecha: ${dateStr}

USUARIO ORIGINAL:
- Comprador: ${original_buyer_name || "N/A"} (${original_buyer_email})
- Primera vez usado: ${originalDate}

INFORMACIÓN TÉCNICA:
- Fingerprint: ${fingerprint}
${session_id ? `- Session ID: ${session_id}` : ""}

${alert_type === "blocked" 
  ? "🔴 TRANSACCIÓN BLOQUEADA AUTOMÁTICAMENTE - Reembolso emitido" 
  : "🟡 TRANSACCIÓN PERMITIDA - Requiere revisión manual"}

ACCIÓN REQUERIDA:
1. Revisar transacción en Stripe Dashboard
2. Verificar si es uso legítimo (familiar, asistente, etc.)
3. Si es fraude: Reembolsar y bloquear manualmente
4. Si es legítimo: Registrar en whitelist

---
Sistema Anti-Fraude Veltlix v2.0
    `.trim();

    // Enviar email usando Amazon SES
    // Soporta tanto AWS_ACCESS_KEY_ID como SMTP_USER
    const awsAccessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID") || Deno.env.get("SMTP_USER");
    const awsSecretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY") || Deno.env.get("SMTP_PASS");
    const awsRegion = Deno.env.get("AWS_REGION") || "us-east-1";
    const sesFromEmail = Deno.env.get("SES_FROM_EMAIL") || "alerts@veltlix.com";
    
    if (awsAccessKeyId && awsSecretAccessKey) {
      console.log("📧 Enviando email vía Amazon SES...");
      
      // Preparar email para SES
      const emailSubject = `🚨 ${alert_type === "blocked" ? "FRAUDE BLOQUEADO" : "ALERTA FRAUDE"}: Tarjeta ${card_brand} ****${card_last4} - Orden #${order_id}`;
      
      // Usar AWS SDK v3 para SES
      const { SESClient, SendEmailCommand } = await import("https://esm.sh/@aws-sdk/client-ses@3.478.0");
      
      const sesClient = new SESClient({
        region: awsRegion,
        credentials: {
          accessKeyId: awsAccessKeyId,
          secretAccessKey: awsSecretAccessKey,
        },
      });

      const sendEmailCommand = new SendEmailCommand({
        Source: `Veltlix Seguridad <${sesFromEmail}>`,
        Destination: {
          ToAddresses: ["info@veltlix.com"],
        },
        Message: {
          Subject: {
            Data: emailSubject,
            Charset: "UTF-8",
          },
          Body: {
            Html: {
              Data: emailHtml,
              Charset: "UTF-8",
            },
            Text: {
              Data: emailText,
              Charset: "UTF-8",
            },
          },
        },
      });

      try {
        const sesResponse = await sesClient.send(sendEmailCommand);
        console.log(`✅ Email enviado via Amazon SES: ${sesResponse.MessageId}`);

        return new Response(
          JSON.stringify({
            success: true,
            message: "Alerta de fraude enviada exitosamente",
            message_id: sesResponse.MessageId,
            provider: "amazon-ses",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (sesError) {
        console.error("❌ Error enviando email via SES:", sesError);
        throw new Error(`SES error: ${sesError instanceof Error ? sesError.message : "Unknown error"}`);
      }
    } else {
      // Fallback: Log del email (para desarrollo)
      console.log("⚠️ AWS SES no configurado (faltan AWS_ACCESS_KEY_ID o AWS_SECRET_ACCESS_KEY)");
      console.log("📧 EMAIL TO:", "info@veltlix.com");
      console.log("📧 SUBJECT:", `🚨 ${alert_type === "blocked" ? "FRAUDE BLOQUEADO" : "ALERTA FRAUDE"}`);
      console.log("📧 BODY:", emailText);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Alerta registrada (email no enviado - AWS SES no configurado)",
          logged: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

  } catch (error) {
    console.error("❌ Error en send-fraud-alert:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Error al enviar alerta de fraude",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

