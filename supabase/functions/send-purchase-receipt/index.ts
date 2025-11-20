import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface ReceiptRequest {
  orderId: string;
  customerEmail: string;
  customerName: string;
}

interface Ticket {
  id: string;
  ticket_code: string;
  event_name: string;
  event_date: string;
  event_time?: string;
  event_location?: string;
  ticket_class?: string;
  seat_number?: string;
  price: number;
  pin?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { orderId, customerEmail, customerName }: ReceiptRequest =
      await req.json();

    // Validar datos requeridos
    if (!orderId || !customerEmail || !customerName) {
      return new Response(
        JSON.stringify({
          error: 'Faltan campos requeridos: orderId, customerEmail, customerName',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`📧 Enviando comprobante para orden ${orderId} a ${customerEmail}`);

    // Inicializar cliente de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener tickets del pedido
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .eq('purchase_id', orderId)
      .order('created_at', { ascending: true });

    if (ticketsError) {
      throw new Error(`Error obteniendo tickets: ${ticketsError.message}`);
    }

    if (!tickets || tickets.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'No se encontraron tickets para este pedido',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`✅ ${tickets.length} tickets encontrados para la orden ${orderId}`);

    // Calcular totales
    const totalAmount = tickets.reduce(
      (sum: number, ticket: Ticket) => sum + ticket.price,
      0
    );
    const ticketCount = tickets.length;

    // Función para generar URL de QR code usando API externa
    const generateQRCodeUrl = (data: string) => {
      // Usar api.qrserver.com para generar QR codes
      const encodedData = encodeURIComponent(data);
      return `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodedData}&format=png&margin=15&ecc=H`;
    };

    // Construir HTML del comprobante con diseño mejorado
    const ticketsHtml = tickets
      .map(
        (ticket: Ticket, index: number) => {
          const qrData = JSON.stringify({
            ticketId: ticket.id,
            code: ticket.ticket_code,
            pin: ticket.pin,
            event: ticket.event_name,
          });
          const qrCodeUrl = generateQRCodeUrl(qrData);
          
          return `
      <div style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); padding: 25px; border-radius: 16px; margin: 25px 0; border: 3px solid #e9ecef; box-shadow: 0 6px 12px rgba(0,0,0,0.12);">
        <div style="display: flex; align-items: flex-start; gap: 25px; flex-wrap: wrap;">
          <!-- QR Code -->
          <div style="flex-shrink: 0; text-align: center;">
            <div style="background: white; padding: 15px; border-radius: 12px; border: 3px solid #c61619; box-shadow: 0 4px 8px rgba(198,22,25,0.25);">
              <img src="${qrCodeUrl}" alt="QR Code del Ticket ${ticket.ticket_code}" style="width: 180px; height: 180px; display: block;" />
            </div>
            <div style="margin-top: 12px; background: linear-gradient(135deg, #c61619 0%, #a01316 100%); padding: 8px 16px; border-radius: 8px;">
              <p style="margin: 0; font-size: 12px; color: #fff; font-weight: bold; letter-spacing: 1px;">ESCANEA EN EL EVENTO</p>
            </div>
          </div>

          <!-- Detalles del Ticket -->
          <div style="flex: 1; min-width: 280px;">
            <div style="background: linear-gradient(135deg, #c61619 0%, #a01316 100%); color: white; padding: 12px 18px; border-radius: 10px; margin-bottom: 16px; box-shadow: 0 4px 8px rgba(198,22,25,0.3);">
              <h3 style="margin: 0; font-size: 18px; font-weight: bold; letter-spacing: 3px; text-align: center;">🎫 TICKET #${index + 1}</h3>
            </div>

            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 2px solid #e9ecef;">
                  <strong style="color: #495057; font-size: 14px;">📝 Código:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 2px solid #e9ecef; text-align: right;">
                  <span style="font-family: 'Courier New', monospace; font-size: 15px; font-weight: bold; color: #c61619;">${ticket.ticket_code}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 2px solid #e9ecef;">
                  <strong style="color: #495057; font-size: 14px;">🎭 Evento:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 2px solid #e9ecef; text-align: right;">
                  <span style="font-size: 14px; font-weight: 600; color: #212529;">${ticket.event_name}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 2px solid #e9ecef;">
                  <strong style="color: #495057; font-size: 14px;">📅 Fecha:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 2px solid #e9ecef; text-align: right;">
                  <span style="font-size: 14px; color: #212529;">${new Date(ticket.event_date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </td>
              </tr>
              ${ticket.event_time ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 2px solid #e9ecef;">
                  <strong style="color: #495057; font-size: 14px;">⏰ Hora:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 2px solid #e9ecef; text-align: right;">
                  <span style="font-size: 14px; font-weight: 600; color: #212529;">${ticket.event_time}</span>
                </td>
              </tr>
              ` : ''}
              ${ticket.event_location ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 2px solid #e9ecef;">
                  <strong style="color: #495057; font-size: 14px;">📍 Ubicación:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 2px solid #e9ecef; text-align: right;">
                  <span style="font-size: 13px; color: #212529;">${ticket.event_location}</span>
                </td>
              </tr>
              ` : ''}
              ${ticket.ticket_class ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 2px solid #e9ecef;">
                  <strong style="color: #495057; font-size: 14px;">🎟️ Clase:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 2px solid #e9ecef; text-align: right;">
                  <span style="background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%); color: #000; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: bold; text-transform: uppercase;">${ticket.ticket_class}</span>
                </td>
              </tr>
              ` : ''}
              ${ticket.seat_number ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 2px solid #e9ecef;">
                  <strong style="color: #495057; font-size: 14px;">💺 Asiento:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 2px solid #e9ecef; text-align: right;">
                  <span style="font-size: 16px; font-weight: bold; color: #212529;">${ticket.seat_number}</span>
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px 0; border-bottom: 2px solid #e9ecef;">
                  <strong style="color: #495057; font-size: 14px;">💵 Precio:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 2px solid #e9ecef; text-align: right;">
                  <span style="font-size: 18px; font-weight: bold; color: #28a745;">$${ticket.price.toFixed(2)} USD</span>
                </td>
              </tr>
              ${ticket.pin ? `
              <tr>
                <td colspan="2" style="padding: 16px 0;">
                  <div style="background: linear-gradient(135deg, #c61619 0%, #a01316 100%); padding: 18px; border-radius: 12px; text-align: center; box-shadow: 0 4px 12px rgba(198,22,25,0.4);">
                    <p style="margin: 0 0 6px 0; color: #fff; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">🔐 PIN DE VALIDACIÓN</p>
                    <p style="margin: 0; color: #fff; font-size: 32px; font-weight: bold; letter-spacing: 12px; font-family: 'Courier New', monospace; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${ticket.pin}</p>
                    <p style="margin: 8px 0 0 0; color: #ffebee; font-size: 11px; font-weight: 600;">⚠️ Requerido para ingresar al evento</p>
                  </div>
                </td>
              </tr>
              ` : ''}
            </table>
          </div>
        </div>
      </div>
    `;
        }
      )
      .join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>✅ Comprobante de Compra - Tiquetera</title>
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f4f4f4 0%, #e9ecef 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 50px 20px;">
              <!-- Container principal -->
              <table role="presentation" style="max-width: 650px; width: 100%; background-color: #ffffff; border-radius: 20px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); overflow: hidden;">

                <!-- Header con logo y título -->
                <tr>
                  <td style="background: linear-gradient(135deg, #c61619 0%, #a01316 100%); padding: 40px; text-align: center; position: relative;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: bold; text-transform: uppercase; letter-spacing: 4px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">🎟️ TIQUETERA</h1>
                    <p style="margin: 12px 0 0 0; color: #ffebee; font-size: 16px; letter-spacing: 1px;">✅ Comprobante de Compra</p>
                  </td>
                </tr>

                <!-- Banner de confirmación -->
                <tr>
                  <td style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 20px 40px; text-align: center;">
                    <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: bold; letter-spacing: 1px;">✨ ¡COMPRA EXITOSA! ✨</p>
                    <p style="margin: 8px 0 0 0; color: #d4edda; font-size: 14px;">Tus boletos digitales están listos</p>
                  </td>
                </tr>

                <!-- Saludo -->
                <tr>
                  <td style="padding: 40px 40px 25px 40px;">
                    <h2 style="margin: 0 0 18px 0; color: #212529; font-size: 26px; font-weight: bold;">¡Hola ${customerName}! 👋</h2>
                    <p style="margin: 0; color: #495057; font-size: 16px; line-height: 1.7;">
                      Gracias por tu compra. Tu pedido ha sido <strong style="color: #28a745;">procesado exitosamente</strong> y tus tickets digitales están listos para usar.
                    </p>
                  </td>
                </tr>

                <!-- Resumen de la orden -->
                <tr>
                  <td style="padding: 0 40px 25px 40px;">
                    <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 25px; border-radius: 14px; border-left: 5px solid #c61619; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 10px 0;">
                            <strong style="color: #495057; font-size: 15px;">📋 Número de Orden:</strong>
                          </td>
                          <td style="padding: 10px 0; text-align: right;">
                            <span style="font-family: 'Courier New', monospace; color: #212529; font-size: 15px; font-weight: bold; background: #ffffff; padding: 4px 10px; border-radius: 6px;">${orderId}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0;">
                            <strong style="color: #495057; font-size: 15px;">🎫 Cantidad de Tickets:</strong>
                          </td>
                          <td style="padding: 10px 0; text-align: right;">
                            <span style="color: #212529; font-size: 16px; font-weight: bold;">${ticketCount}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0;">
                            <strong style="color: #495057; font-size: 15px;">💳 Total Pagado:</strong>
                          </td>
                          <td style="padding: 10px 0; text-align: right;">
                            <span style="color: #28a745; font-size: 22px; font-weight: bold;">$${totalAmount.toFixed(2)} USD</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0;">
                            <strong style="color: #495057; font-size: 15px;">📅 Fecha de Compra:</strong>
                          </td>
                          <td style="padding: 10px 0; text-align: right;">
                            <span style="color: #212529; font-size: 14px;">${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- Título de tickets -->
                <tr>
                  <td style="padding: 25px 40px 15px 40px;">
                    <h2 style="margin: 0; color: #c61619; font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; border-bottom: 4px solid #c61619; padding-bottom: 12px; text-align: center;">
                      🎫 TUS BOLETOS DIGITALES
                    </h2>
                  </td>
                </tr>

                <!-- Tickets -->
                <tr>
                  <td style="padding: 0 40px 25px 40px;">
                    ${ticketsHtml}
                  </td>
                </tr>

                <!-- Información importante -->
                <tr>
                  <td style="padding: 0 40px 35px 40px;">
                    <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffe9a6 100%); padding: 25px; border-radius: 14px; border-left: 5px solid #ffc107; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                      <p style="margin: 0 0 14px 0; color: #856404; font-size: 18px; font-weight: bold;">⚠️ Información Importante</p>
                      <ul style="margin: 0; padding-left: 22px; color: #856404; font-size: 15px; line-height: 1.9;">
                        <li><strong>Guarda este email</strong> como comprobante de tu compra</li>
                        <li><strong>Presenta el código QR</strong> de cada ticket en el evento</li>
                        <li>El <strong>PIN de validación</strong> será requerido al ingresar</li>
                        <li><strong>No compartas</strong> tus códigos de ticket con nadie</li>
                        <li>Puedes <strong>re-descargar</strong> tus tickets desde tu cuenta en cualquier momento</li>
                        <li>Los tickets son <strong>100% digitales</strong> - no necesitas imprimirlos</li>
                      </ul>
                    </div>
                  </td>
                </tr>

                <!-- CTA - Acceso a cuenta -->
                <tr>
                  <td style="padding: 0 40px 35px 40px; text-align: center;">
                    <p style="margin: 0 0 16px 0; color: #6c757d; font-size: 14px;">¿Necesitas ver tus tickets nuevamente?</p>
                    <a href="${supabaseUrl.replace('/rest/v1', '')}/#my-tickets" style="display: inline-block; background: linear-gradient(135deg, #c61619 0%, #a01316 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: bold; font-size: 16px; letter-spacing: 1px; box-shadow: 0 6px 12px rgba(198,22,25,0.4); text-transform: uppercase;">
                      🎫 Ver Mis Tickets
                    </a>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 35px 40px; border-top: 2px solid #e9ecef;">
                    <p style="margin: 0 0 12px 0; color: #495057; font-size: 15px; line-height: 1.7;">
                      Si tienes alguna <strong>pregunta</strong> o necesitas <strong>ayuda</strong>, no dudes en contactarnos respondiendo a este email o visitando nuestro centro de ayuda.
                    </p>
                    <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.6;">
                      Saludos cordiales,<br>
                      <strong style="color: #c61619; font-size: 16px;">El equipo de Tiquetera 🎟️</strong>
                    </p>
                  </td>
                </tr>

                <!-- Footer legal -->
                <tr>
                  <td style="background-color: #212529; padding: 25px 40px; text-align: center;">
                    <p style="margin: 0; color: #adb5bd; font-size: 12px; line-height: 1.6;">
                      © ${new Date().getFullYear()} <strong>Tiquetera</strong>. Todos los derechos reservados.<br>
                      Este es un email automático, por favor no responder directamente.<br>
                      <a href="#" style="color: #6c757d; text-decoration: none;">Términos y Condiciones</a> | <a href="#" style="color: #6c757d; text-decoration: none;">Política de Privacidad</a>
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const emailText = `
🎟️ TIQUETERA - COMPROBANTE DE COMPRA
=========================================

✨ ¡COMPRA EXITOSA! ✨
Tus boletos digitales están listos

¡Hola ${customerName}! 👋

Gracias por tu compra. Tu pedido ha sido procesado exitosamente y tus tickets digitales están listos para usar.

RESUMEN DE LA ORDEN
-------------------
📋 Número de Orden: ${orderId}
🎫 Cantidad de Tickets: ${ticketCount}
💳 Total Pagado: $${totalAmount.toFixed(2)} USD
📅 Fecha de Compra: ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}

🎫 TUS BOLETOS DIGITALES
------------------------
${tickets.map((t: Ticket, idx: number) => `
TICKET #${idx + 1}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📝 Código: ${t.ticket_code}
  🎭 Evento: ${t.event_name}
  📅 Fecha: ${new Date(t.event_date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
  ${t.event_time ? `⏰ Hora: ${t.event_time}` : ''}
  ${t.event_location ? `📍 Ubicación: ${t.event_location}` : ''}
  ${t.ticket_class ? `🎟️ Clase: ${t.ticket_class}` : ''}
  ${t.seat_number ? `💺 Asiento: ${t.seat_number}` : ''}
  💵 Precio: $${t.price.toFixed(2)} USD
  ${t.pin ? `🔐 PIN de Validación: ${t.pin}\n  ⚠️ REQUERIDO PARA INGRESAR AL EVENTO` : ''}
`).join('\n')}

⚠️ INFORMACIÓN IMPORTANTE
------------------------
• Guarda este email como comprobante de tu compra
• Presenta el código QR de cada ticket en el evento
• El PIN de validación será requerido al ingresar
• No compartas tus códigos de ticket con nadie
• Puedes re-descargar tus tickets desde tu cuenta en cualquier momento
• Los tickets son 100% digitales - no necesitas imprimirlos

═══════════════════════════════════════

Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos
respondiendo a este email o visitando nuestro centro de ayuda.

Saludos cordiales,
El equipo de Tiquetera 🎟️

© ${new Date().getFullYear()} Tiquetera. Todos los derechos reservados.
Este es un email automático, por favor no responder directamente.
    `.trim();

    // Enviar email usando la función send-email
    console.log(`📤 Enviando email a ${customerEmail}...`);
    
    const emailResponse = await fetch(
      `${supabaseUrl}/functions/v1/send-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          to: customerEmail,
          subject: `✅ Comprobante de Compra - Orden ${orderId} - Tiquetera`,
          text: emailText,
          html: emailHtml,
        }),
      }
    );

    if (!emailResponse.ok) {
      const emailError = await emailResponse.text();
      console.error('❌ Error enviando email:', emailError);
      throw new Error(`Error enviando email: ${emailError}`);
    }

    const emailResult = await emailResponse.json();
    console.log(`✅ Email enviado exitosamente a ${customerEmail}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Comprobante enviado exitosamente',
        orderId,
        ticketCount,
        totalAmount,
        customerEmail,
        emailResult,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error enviando comprobante:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Error desconocido',
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
