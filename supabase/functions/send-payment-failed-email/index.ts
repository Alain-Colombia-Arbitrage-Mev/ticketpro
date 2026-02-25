import { CORS_HEADERS } from "../_shared/cors.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import nodemailer from 'npm:nodemailer@6.9.7';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface PaymentFailedRequest {
  customerEmail: string;
  customerName: string;
  orderId?: string;
  sessionId?: string;
  amount?: number;
  currency?: string;
  failureReason?: string;
  items?: Array<{
    eventName: string;
    quantity: number;
    price: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const {
      customerEmail,
      customerName,
      orderId,
      sessionId,
      amount,
      currency = 'USD',
      failureReason = 'El pago no pudo ser procesado',
      items = [],
    }: PaymentFailedRequest = await req.json();

    const safeCustomerName = escapeHtml(customerName);

    // Validar datos requeridos
    if (!customerEmail || !customerName) {
      return new Response(
        JSON.stringify({
          error: 'Faltan campos requeridos: customerEmail, customerName',
        }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`📧 Preparando email de pago fallido para: ${customerEmail}`);

    // Obtener configuración SMTP
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');
    const smtpEndpoint = Deno.env.get('SMTP_ENDPOINT') || 'email-smtp.us-east-1.amazonaws.com';
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
    const fromEmail = Deno.env.get('EMAIL_FROM') || 'noreply@veltlix.com';

    if (!smtpUser || !smtpPass) {
      console.warn('SMTP_USER o SMTP_PASS no configurados');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Configuración de email no disponible',
        }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    // URL del frontend
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:3002';

    // Construir lista de items si existe
    let itemsHtml = '';
    if (items.length > 0) {
      itemsHtml = `
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #495057; margin-top: 0; font-size: 16px; font-weight: 600;">📋 Detalles del Pedido</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${items.map(item => `
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 12px 0; color: #495057;">
                  <strong>${item.eventName}</strong><br>
                  <span style="color: #6c757d; font-size: 14px;">Cantidad: ${item.quantity}</span>
                </td>
                <td style="padding: 12px 0; text-align: right; color: #495057; font-weight: 600;">
                  $${(item.price * item.quantity).toLocaleString()} ${currency}
                </td>
              </tr>
            `).join('')}
          </table>
          ${amount ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #dee2e6;">
              <table style="width: 100%;">
                <tr>
                  <td style="color: #212529; font-size: 16px; font-weight: 700;">Total:</td>
                  <td style="text-align: right; color: #212529; font-size: 18px; font-weight: 700;">
                    $${amount.toLocaleString()} ${currency}
                  </td>
                </tr>
              </table>
            </div>
          ` : ''}
        </div>
      `;
    }

    // Template HTML profesional
    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Problema con tu Pago</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header con ícono de advertencia -->
          <tr>
            <td style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <div style="background-color: rgba(255, 255, 255, 0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 48px; color: #ffffff;">⚠️</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                Problema con tu Pago
              </h1>
            </td>
          </tr>

          <!-- Contenido principal -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #212529; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hola <strong>${safeCustomerName}</strong>,
              </p>
              
              <p style="color: #495057; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                Lamentablemente, no pudimos procesar tu pago para tu compra de boletos. Esto puede ocurrir por diversas razones.
              </p>

              <!-- Razón del fallo -->
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; border-radius: 6px; margin: 20px 0;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  <strong>⚠️ Motivo:</strong> ${failureReason}
                </p>
              </div>

              ${itemsHtml}

              <!-- Información adicional si existe -->
              ${orderId || sessionId ? `
                <div style="background-color: #f8f9fa; border-radius: 6px; padding: 15px 20px; margin: 20px 0;">
                  ${orderId ? `
                    <p style="color: #6c757d; font-size: 13px; margin: 0 0 8px;">
                      <strong>ID de Referencia:</strong> <code style="background-color: #e9ecef; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace;">${orderId}</code>
                    </p>
                  ` : ''}
                  ${sessionId ? `
                    <p style="color: #6c757d; font-size: 13px; margin: 0;">
                      <strong>ID de Sesión:</strong> <code style="background-color: #e9ecef; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; font-size: 11px;">${sessionId}</code>
                    </p>
                  ` : ''}
                </div>
              ` : ''}

              <!-- Razones comunes -->
              <div style="margin: 30px 0;">
                <h3 style="color: #212529; font-size: 18px; font-weight: 600; margin: 0 0 15px;">
                  🔍 Razones Comunes del Rechazo
                </h3>
                <ul style="color: #495057; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Fondos insuficientes en la cuenta</li>
                  <li>Información de la tarjeta incorrecta o desactualizada</li>
                  <li>Límite de crédito excedido</li>
                  <li>Tarjeta bloqueada o restringida por tu banco</li>
                  <li>Problemas de seguridad detectados por el emisor</li>
                </ul>
              </div>

              <!-- Pasos siguientes -->
              <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #1976d2; font-size: 18px; font-weight: 600; margin: 0 0 15px;">
                  ✨ ¿Qué puedes hacer?
                </h3>
                <ol style="color: #1565c0; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li><strong>Verifica los datos de tu tarjeta</strong> - Asegúrate de que la información sea correcta</li>
                  <li><strong>Contacta a tu banco</strong> - Ellos pueden aclarar por qué fue rechazado</li>
                  <li><strong>Intenta con otra tarjeta</strong> - Si tienes otra forma de pago disponible</li>
                  <li><strong>Prueba otro método de pago</strong> - Ofrecemos múltiples opciones de pago</li>
                </ol>
              </div>

              <!-- Botones de acción -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <table role="presentation" style="border-collapse: separate;">
                      <tr>
                        <td>
                          <a href="${frontendUrl}/#/checkout" style="display: inline-block; background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3); transition: all 0.3s ease;">
                            🔄 Intentar Pago Nuevamente
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 15px 0 0;">
                    <a href="${frontendUrl}/#/contact" style="color: #6c757d; text-decoration: none; font-size: 14px; border-bottom: 1px solid #6c757d;">
                      💬 Contactar Soporte
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Nota de ayuda -->
              <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 30px;">
                <p style="color: #6c757d; font-size: 13px; line-height: 1.6; margin: 0;">
                  <strong>💡 Consejo:</strong> Si continúas experimentando problemas, nuestro equipo de soporte está disponible 24/7 para ayudarte. No dudes en contactarnos.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #dee2e6;">
              <p style="color: #6c757d; font-size: 12px; line-height: 1.5; margin: 0 0 10px;">
                Este es un correo automático de notificación. Por favor no respondas a este mensaje.
              </p>
              <p style="color: #6c757d; font-size: 12px; line-height: 1.5; margin: 0;">
                <strong>Tiquetera</strong> | ${frontendUrl}<br>
                © ${new Date().getFullYear()} Todos los derechos reservados
              </p>
              <div style="margin-top: 15px;">
                <a href="${frontendUrl}/#/terms" style="color: #007bff; text-decoration: none; font-size: 11px; margin: 0 8px;">Términos</a>
                <span style="color: #dee2e6;">|</span>
                <a href="${frontendUrl}/#/privacy" style="color: #007bff; text-decoration: none; font-size: 11px; margin: 0 8px;">Privacidad</a>
                <span style="color: #dee2e6;">|</span>
                <a href="${frontendUrl}/#/contact" style="color: #007bff; text-decoration: none; font-size: 11px; margin: 0 8px;">Contacto</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Contenido de texto plano
    const textContent = `
Hola ${customerName},

Lamentablemente, no pudimos procesar tu pago para tu compra de boletos.

Motivo: ${failureReason}

${items.length > 0 ? `
Detalles del pedido:
${items.map(item => `- ${item.eventName} x${item.quantity}: $${(item.price * item.quantity).toLocaleString()} ${currency}`).join('\n')}
${amount ? `\nTotal: $${amount.toLocaleString()} ${currency}` : ''}
` : ''}

${orderId ? `ID de Referencia: ${orderId}` : ''}
${sessionId ? `ID de Sesión: ${sessionId}` : ''}

Razones comunes del rechazo:
- Fondos insuficientes en la cuenta
- Información de la tarjeta incorrecta
- Límite de crédito excedido
- Tarjeta bloqueada por tu banco

¿Qué puedes hacer?
1. Verifica los datos de tu tarjeta
2. Contacta a tu banco
3. Intenta con otra tarjeta
4. Prueba otro método de pago

Para intentar nuevamente: ${frontendUrl}/#/checkout
Para contactar soporte: ${frontendUrl}/#/contact

--
Este es un correo automático. Por favor no respondas a este mensaje.
Tiquetera | ${frontendUrl}
© ${new Date().getFullYear()} Todos los derechos reservados
    `;

    // Crear transporter de nodemailer
    console.log(`📧 Conectando a Amazon SES (${smtpEndpoint}:${smtpPort})`);
    
    const transporter = nodemailer.createTransport({
      host: smtpEndpoint,
      port: smtpPort,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Enviar email
    const info = await transporter.sendMail({
      from: `"Tiquetera - Soporte" <${fromEmail}>`,
      to: customerEmail,
      subject: '⚠️ Problema con tu Pago - Acción Requerida',
      text: textContent,
      html: htmlContent,
    });

    console.log('✅ Email de pago fallido enviado exitosamente');
    console.log(`   Message ID: ${info.messageId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email de pago fallido enviado exitosamente',
        messageId: info.messageId,
        recipient: customerEmail,
      }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error al enviar email de pago fallido:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
});

