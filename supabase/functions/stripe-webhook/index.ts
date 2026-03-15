/**
 * Supabase Edge Function: Stripe Webhook Handler
 * 
 * Maneja eventos de Stripe (especialmente checkout.session.completed)
 * y crea tickets automáticamente en Supabase cuando un pago es exitoso.
 * 
 * Environment variables necesarias:
 *   - STRIPE_SECRET_KEY_TEST / STRIPE_SECRET_KEY_PROD
 *   - STRIPE_WEBHOOK_SECRET (obtener de Stripe Dashboard > Webhooks)
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { WEBHOOK_CORS_HEADERS, webhookCorsResponse } from "../_shared/cors.ts";

// Helper: generar código de ticket aleatorio
function randomCode(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, v => chars[v % chars.length]).join("");
}

// Helper: generar PIN de 4 dígitos
function randomPin(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(1000 + (array[0] % 9000));
}

// Helper: log transaction to transaction_logs table
async function logTransaction(
  supabase: any,
  data: {
    event_type: string;
    stripe_event_id: string;
    order_id?: string;
    order_uuid?: string;
    buyer_email?: string;
    amount?: number;
    currency?: string;
    payment_intent_id?: string;
    payment_status?: string;
    metadata?: Record<string, any>;
  }
) {
  try {
    const { error } = await supabase
      .from("transaction_logs")
      .insert({
        event_type: data.event_type,
        stripe_event_id: data.stripe_event_id,
        order_id: data.order_id || null,
        order_uuid: data.order_uuid || null,
        buyer_email: data.buyer_email || null,
        amount: data.amount || null,
        currency: data.currency || "usd",
        payment_intent_id: data.payment_intent_id || null,
        payment_status: data.payment_status || null,
        metadata: data.metadata || null,
      });
    if (error) {
      console.warn("Failed to log transaction:", error.message);
    }
  } catch (e) {
    console.warn("logTransaction error:", e);
  }
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return webhookCorsResponse();
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...WEBHOOK_CORS_HEADERS } }
    );
  }

  try {
    // Obtener configuración
    // IMPORTANTE: Las claves secretas NO deben tener prefijo VITE_
    // Configurar en Supabase Dashboard > Functions > Secrets
    const isProd = Deno.env.get("ENVIRONMENT") === "production";
    const stripeSecretKey = 
      Deno.env.get(isProd ? "STRIPE_SECRET_KEY_PROD" : "STRIPE_SECRET_KEY_TEST") ||
      Deno.env.get("stripe_private_key") ||
      Deno.env.get("STRIPE_PRIVATE_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeSecretKey || !webhookSecret) {
      console.error("Missing Stripe configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...WEBHOOK_CORS_HEADERS } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...WEBHOOK_CORS_HEADERS } }
      );
    }

    // Inicializar Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-11-20.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Inicializar Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener signature y body
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: { "Content-Type": "application/json", ...WEBHOOK_CORS_HEADERS } }
      );
    }

    const body = await req.text();

    // Verificar webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { "Content-Type": "application/json", ...WEBHOOK_CORS_HEADERS } }
      );
    }

    console.log(`Received event: ${event.type}`);

    // Manejar evento checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log(`Processing completed session: ${session.id}`);

      // Extraer metadata
      const orderId = session.metadata?.orderId;
      const buyerEmail = session.customer_email || session.metadata?.buyerEmail;
      const buyerFullName = session.metadata?.buyerFullName || "";
      const itemsJson = session.metadata?.items;

      if (!orderId || !buyerEmail || !itemsJson) {
        console.error("Missing required metadata in session", {
          orderId,
          buyerEmail,
          hasItems: !!itemsJson,
        });
        return new Response(
          JSON.stringify({ received: true, warning: "Missing metadata" }),
          { status: 200, headers: { "Content-Type": "application/json", ...WEBHOOK_CORS_HEADERS } }
        );
      }

      // Parse items
      let items: any[];
      try {
        items = JSON.parse(itemsJson);
      } catch (e) {
        console.error("Failed to parse items JSON:", e);
        return new Response(
          JSON.stringify({ received: true, warning: "Invalid items JSON" }),
          { status: 200, headers: { "Content-Type": "application/json", ...WEBHOOK_CORS_HEADERS } }
        );
      }

      // Expandir items por cantidad
      const expandedItems: any[] = [];
      for (const item of items) {
        const quantity = Math.max(1, Number(item.quantity || 1));
        for (let i = 0; i < quantity; i++) {
          expandedItems.push(item);
        }
      }

      // PASO 1: Crear orden en tabla orders
      const nowIso = new Date().toISOString();
      // Usar la URL del frontend en producción, no la de la función
      const origin = Deno.env.get("FRONTEND_URL") || "https://veltlix.com";

      const paymentStatus = session.payment_status;
      if (paymentStatus !== "paid") {
        console.log(`Session ${session.id} payment_status is "${paymentStatus}", skipping ticket creation`);
        return new Response(
          JSON.stringify({ received: true, skipped: true, reason: `payment_status is ${paymentStatus}` }),
          { status: 200, headers: { "Content-Type": "application/json", ...WEBHOOK_CORS_HEADERS } }
        );
      }

      const orderData = {
        order_id: orderId,
        buyer_email: buyerEmail,
        buyer_name: buyerFullName || null,
        payment_status: paymentStatus,
        payment_method: "stripe",
        total_amount: session.amount_total || 0,
        currency: session.currency || "usd",
        items: items,
        stripe_session_id: session.id,
        metadata: {
          paymentIntent: session.payment_intent,
          customerDetails: session.customer_details,
        },
        created_at: nowIso,
        updated_at: nowIso,
      };
      
      console.log("=== ORDER DATA TO INSERT ===");
      console.log(JSON.stringify(orderData, null, 2));

      // VERIFICAR SI LA ORDEN YA EXISTE (manejo de reintentos de Stripe)
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();

      let createdOrder;

      if (existingOrder) {
        console.log(`Order ${orderId} already exists, updating status if needed`);
        
        // Actualizar si el estado es diferente
        if (existingOrder.payment_status !== paymentStatus) {
          const { data: updated, error: updateError } = await supabase
            .from("orders")
            .update({
              payment_status: paymentStatus,
              updated_at: nowIso,
              completed_at: nowIso
            })
            .eq("order_id", orderId)
            .select()
            .single();

          if (updateError) {
            console.error("Failed to update order:", updateError);
          } else {
            console.log(`Order ${orderId} updated to ${paymentStatus}`);
          }
        }

        createdOrder = existingOrder;
      } else {
        // Crear nueva orden
        const { data: newOrder, error: orderError } = await supabase
          .from("orders")
          .insert(orderData)
          .select()
          .single();

        if (orderError) {
          console.error("Failed to create order:", orderError);
          return new Response(
            JSON.stringify({ 
              received: true, 
              error: "Failed to create order",
              details: orderError.message 
            }),
            { status: 500, headers: { "Content-Type": "application/json", ...WEBHOOK_CORS_HEADERS } }
          );
        }

        createdOrder = newOrder;
        console.log(`Order created: ${createdOrder.id}`);
      }

      // Log checkout completion to transaction_logs
      await logTransaction(supabase, {
        event_type: "checkout.session.completed",
        stripe_event_id: event.id,
        order_id: orderId,
        order_uuid: createdOrder.id,
        buyer_email: buyerEmail,
        amount: session.amount_total || 0,
        currency: session.currency || "usd",
        payment_intent_id: session.payment_intent as string || undefined,
        payment_status: paymentStatus,
        metadata: { sessionId: session.id },
      });

      // PASO 2: Crear tickets vinculados a la orden
      const ticketRecords = expandedItems.map((item) => {
        const ticketCode = randomCode(12);
        const pin = randomPin();
        const tempId = crypto.randomUUID();

        // URL temporal (la actualizaremos después con el ID real)
        const qrCode = `${origin}/validate-ticket?ticketId=${tempId}&code=${ticketCode}`;

        // Asegurar que event_id sea integer y buyer_full_name no sea null
        const eventId = typeof item.eventId === 'string' ? parseInt(item.eventId, 10) : (item.eventId ?? 0);
        const finalBuyerName = buyerFullName || item.buyerFullName || 'Cliente';

        return {
          ticket_code: ticketCode,
          pin: pin, // ✅ PIN único de seguridad para cada ticket
          qr_code: qrCode,
          status: "issued_unused",
          event_id: eventId,
          event_name: item.eventName ?? "Evento",
          event_date: item.eventDate ?? nowIso.split("T")[0],
          event_time: item.eventTime ?? null,
          event_location: item.eventLocation ?? null,
          event_category: item.eventCategory ?? null,
          buyer_email: buyerEmail,
          buyer_id: null, // Se llenará automáticamente por el trigger si existe el usuario
          buyer_full_name: finalBuyerName,
          buyer_address: item.buyerAddress ?? null,
          ticket_type: item.ticketType ?? "General",
          seat_number: item.seatNumber ?? null,
          seat_type: item.seatType ?? "general",
          gate_number: item.gateNumber ?? null,
          ticket_class: item.ticketClass ?? item.ticketType ?? "General",
          ticket_category_id: item.ticketCategoryId ?? null,
          price: Number(item.price ?? 0),
          price_paid: Number(item.price ?? 0),
          payment_method_id: "11111111-1111-1111-1111-111111111111", // UUID de stripe en payment_methods
          order_uuid: createdOrder.id, // Vincular con la orden creada
          purchase_id: orderId,
          purchase_summary: {
            stripe: {
              sessionId: session.id,
              paymentIntent: session.payment_intent,
              amountTotal: session.amount_total,
              currency: session.currency,
              paymentStatus: session.payment_status,
            },
            purchaseDate: nowIso,
            paymentMethod: "stripe",
            orderId,
          },
          pin,
          metadata: {
            source: "stripe_webhook",
            pin_generated_at: nowIso,
            stripeSessionId: session.id,
          },
        };
      });

      // PASO 3: Verificar si ya existen tickets para esta orden
      const { data: existingTickets } = await supabase
        .from("tickets")
        .select("id")
        .eq("order_uuid", createdOrder.id);

      let insertedTickets;

      if (existingTickets && existingTickets.length > 0) {
        console.log(`Tickets already exist for order ${orderId} (${existingTickets.length} tickets)`);
        
        // Obtener los tickets existentes para retornarlos
        const { data: allTickets } = await supabase
          .from("tickets")
          .select("*")
          .eq("order_uuid", createdOrder.id);
        
        insertedTickets = allTickets;
      } else {
        // Insertar nuevos tickets
        const { data: newTickets, error: insertError } = await supabase
          .from("tickets")
          .insert(ticketRecords)
          .select();

        if (insertError) {
          console.error("Failed to insert tickets:", insertError);
          return new Response(
            JSON.stringify({ 
              received: true, 
              error: "Failed to create tickets",
              details: insertError.message 
            }),
            { status: 500, headers: { "Content-Type": "application/json", ...WEBHOOK_CORS_HEADERS } }
          );
        }

        insertedTickets = newTickets;
        console.log(`Created ${insertedTickets?.length || 0} tickets for order ${orderId}`);
      }

      // Actualizar QR codes con IDs reales
      if (insertedTickets && insertedTickets.length > 0) {
        for (const ticket of insertedTickets) {
          const finalQrCode = `${origin}/validate-ticket?ticketId=${ticket.id}&code=${ticket.ticket_code}`;

          await supabase
            .from("tickets")
            .update({ qr_code: finalQrCode, updated_at: nowIso })
            .eq("id", ticket.id);
        }

        // 🔒 CAPTURAR CARD FINGERPRINT y DETECTAR FRAUDE
        let fraudDetected = false;
        let fraudReason = "";
        
        try {
          if (session.payment_intent) {
            console.log("🔍 Obteniendo fingerprint de tarjeta...");
            
            // Expandir PaymentIntent para obtener payment_method con fingerprint
            const paymentIntent = await stripe.paymentIntents.retrieve(
              session.payment_intent as string,
              { expand: ['payment_method'] }
            );

            if (paymentIntent && paymentIntent.payment_method) {
              const paymentMethod = paymentIntent.payment_method as Stripe.PaymentMethod;
              
              if (paymentMethod.card && paymentMethod.card.fingerprint) {
                const fingerprint = paymentMethod.card.fingerprint;
                const last4 = paymentMethod.card.last4;
                const brand = paymentMethod.card.brand;
                const exp_month = paymentMethod.card.exp_month;
                const exp_year = paymentMethod.card.exp_year;

                console.log(`💳 Card fingerprint: ${fingerprint}, Last4: ${last4}`);

                // Buscar TODOS los registros con este fingerprint
                const { data: allFingerprints } = await supabase
                  .from("card_fingerprints")
                  .select("*")
                  .eq("fingerprint", fingerprint)
                  .order("first_used_at", { ascending: true });

                // Buscar si ya existe este fingerprint + email
                const existingForThisEmail = allFingerprints?.find(
                  (record: any) => record.buyer_email.toLowerCase() === buyerEmail.toLowerCase()
                );

                if (existingForThisEmail) {
                  // Mismo usuario, actualizar use_count
                  await supabase
                    .from("card_fingerprints")
                    .update({
                      use_count: existingForThisEmail.use_count + 1,
                      last_used_at: nowIso,
                    })
                    .eq("id", existingForThisEmail.id);
                  
                  console.log(`✅ Fingerprint actualizado (uso #${existingForThisEmail.use_count + 1})`);
                } else if (allFingerprints && allFingerprints.length > 0) {
                  // 🚨 FRAUDE DETECTADO: Tarjeta usada por otro usuario
                  const firstUser = allFingerprints[0];
                  fraudDetected = true;
                  fraudReason = `Tarjeta (...${last4}) ya registrada por ${firstUser.buyer_email}`;
                  
                  console.log(`🚨 FRAUDE DETECTADO: ${fraudReason}`);

                  // 📧 ENVIAR ALERTA DE FRAUDE POR EMAIL
                  try {
                    const alertResponse = await fetch(
                      `${supabaseUrl}/functions/v1/send-fraud-alert`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${supabaseServiceKey}`,
                        },
                        body: JSON.stringify({
                          fingerprint,
                          current_buyer_email: buyerEmail,
                          current_buyer_name: buyerFullName,
                          original_buyer_email: firstUser.buyer_email,
                          original_buyer_name: firstUser.buyer_name,
                          card_last4: last4,
                          card_brand: brand,
                          order_id: orderId,
                          session_id: session.id,
                          amount: session.amount_total || 0,
                          currency: session.currency || "usd",
                          original_first_used: firstUser.first_used_at,
                          alert_type: "blocked",
                        }),
                      }
                    );

                    if (alertResponse.ok) {
                      console.log(`✅ Alerta de fraude enviada a info@trustwisebank.co`);
                    } else {
                      console.warn(`⚠️ No se pudo enviar alerta de fraude: ${await alertResponse.text()}`);
                    }
                  } catch (alertError) {
                    console.warn('⚠️ Error enviando alerta de fraude:', alertError);
                    // No fallar el webhook si el email falla
                  }
                  
                  // Registrar intento fraudulento
                  await supabase
                    .from("card_fingerprints")
                    .insert({
                      fingerprint,
                      buyer_email: buyerEmail.toLowerCase(),
                      buyer_name: buyerFullName || null,
                      last4,
                      brand,
                      exp_month,
                      exp_year,
                      use_count: 1,
                      is_blocked: true,
                      blocked_reason: `Uso de tarjeta de terceros detectado. Tarjeta previamente usada por: ${firstUser.buyer_email}`,
                      metadata: {
                        fraud_detected: true,
                        fraud_order_id: orderId,
                        fraud_session_id: session.id,
                        original_owner: firstUser.buyer_email,
                        original_first_used: firstUser.first_used_at,
                      },
                    });

                  // Cancelar PaymentIntent y reembolsar
                  try {
                    await stripe.refunds.create({
                      payment_intent: paymentIntent.id,
                      reason: 'fraudulent',
                      metadata: {
                        fraud_reason: fraudReason,
                        original_owner: firstUser.buyer_email,
                      },
                    });
                    console.log(`💰 Reembolso automático emitido por fraude`);
                  } catch (refundError) {
                    console.error(`❌ Error al reembolsar:`, refundError);
                  }

                  // Marcar orden como fraudulenta
                  await supabase
                    .from("orders")
                    .update({
                      payment_status: "fraud_detected",
                      metadata: {
                        ...orderData.metadata,
                        fraud_detected: true,
                        fraud_reason: fraudReason,
                        refunded_at: nowIso,
                      },
                      updated_at: nowIso,
                    })
                    .eq("order_id", orderId);

                  // Log fraud detection
                  await logTransaction(supabase, {
                    event_type: "fraud_detected",
                    stripe_event_id: event.id,
                    order_id: orderId,
                    order_uuid: createdOrder.id,
                    buyer_email: buyerEmail,
                    amount: session.amount_total || 0,
                    currency: session.currency || "usd",
                    payment_intent_id: (session.payment_intent as string) || undefined,
                    payment_status: "fraud_detected",
                    metadata: { reason: fraudReason, refunded: true },
                  });

                  // Marcar tickets como cancelados
                  if (insertedTickets && insertedTickets.length > 0) {
                    await supabase
                      .from("tickets")
                      .update({ 
                        status: "cancelled",
                        metadata: {
                          cancellation_reason: "fraud_detected",
                          fraud_reason: fraudReason,
                        },
                        updated_at: nowIso,
                      })
                      .in("id", insertedTickets.map((t: any) => t.id));
                    
                    console.log(`❌ ${insertedTickets.length} tickets cancelados por fraude`);
                  }

                } else {
                  // Primer uso de esta tarjeta, registrar
                  await supabase
                    .from("card_fingerprints")
                    .insert({
                      fingerprint,
                      buyer_email: buyerEmail.toLowerCase(),
                      buyer_name: buyerFullName || null,
                      last4,
                      brand,
                      exp_month,
                      exp_year,
                      use_count: 1,
                      is_blocked: false,
                      metadata: {
                        first_order_id: orderId,
                        first_session_id: session.id,
                      },
                    });
                  
                  console.log(`✅ Nuevo fingerprint registrado`);
                }
              }
            }
          }
        } catch (fingerprintError) {
          console.warn("⚠️ Error en proceso de fingerprint:", fingerprintError);
          // No fallar el webhook si el fingerprint falla
        }

        // Enviar comprobante de compra por email (solo si NO hay fraude)
        if (!fraudDetected) {
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
                  customerName: buyerFullName || 'Cliente',
                }),
              }
            );

            if (receiptResponse.ok) {
              console.log(`Comprobante enviado a ${buyerEmail} para orden ${orderId}`);
            } else {
              console.warn(`No se pudo enviar comprobante: ${await receiptResponse.text()}`);
            }
          } catch (emailError) {
            console.warn('Error enviando comprobante:', emailError);
            // No fallar el webhook si el email falla
          }
        } else {
          // Enviar notificación de fraude detectado
          console.log(`🚨 Fraude detectado, NO se envía comprobante. Razón: ${fraudReason}`);
          
          // TODO: Enviar email al usuario notificando que su transacción fue cancelada por seguridad
          // TODO: Enviar alerta al equipo de administración sobre el intento de fraude
        }
      }

      return new Response(
        JSON.stringify({
          received: true,
          orderId,
          ticketsCreated: insertedTickets?.length || 0,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...WEBHOOK_CORS_HEADERS } }
      );
    }

    // Handle payment_intent.payment_failed
    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const failureMessage = paymentIntent.last_payment_error?.message || "Unknown failure";

      // Find order by payment_intent
      const { data: failedOrder } = await supabase
        .from("orders")
        .select("id, order_id, buyer_email")
        .eq("stripe_payment_intent_id", paymentIntent.id)
        .maybeSingle();

      if (failedOrder) {
        await supabase
          .from("orders")
          .update({ payment_status: "failed", updated_at: new Date().toISOString() })
          .eq("id", failedOrder.id);
      }

      await logTransaction(supabase, {
        event_type: "payment_intent.payment_failed",
        stripe_event_id: event.id,
        order_id: failedOrder?.order_id,
        order_uuid: failedOrder?.id,
        buyer_email: failedOrder?.buyer_email || paymentIntent.receipt_email || undefined,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        payment_intent_id: paymentIntent.id,
        payment_status: "failed",
        metadata: { failure_message: failureMessage },
      });

      console.log(`Payment failed for PI ${paymentIntent.id}: ${failureMessage}`);

      return new Response(
        JSON.stringify({ received: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...WEBHOOK_CORS_HEADERS } }
      );
    }

    // Handle charge.refunded
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;

      const { data: refundedOrder } = await supabase
        .from("orders")
        .select("id, order_id, buyer_email")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .maybeSingle();

      if (refundedOrder) {
        await supabase
          .from("orders")
          .update({ payment_status: "refunded", updated_at: new Date().toISOString() })
          .eq("id", refundedOrder.id);

        // Cancel associated tickets
        await supabase
          .from("tickets")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("order_uuid", refundedOrder.id);
      }

      await logTransaction(supabase, {
        event_type: "charge.refunded",
        stripe_event_id: event.id,
        order_id: refundedOrder?.order_id,
        order_uuid: refundedOrder?.id,
        buyer_email: refundedOrder?.buyer_email || charge.billing_details?.email || undefined,
        amount: charge.amount_refunded,
        currency: charge.currency,
        payment_intent_id: paymentIntentId,
        payment_status: "refunded",
        metadata: { refund_id: charge.refunds?.data?.[0]?.id },
      });

      console.log(`Charge refunded: ${charge.id}`);

      return new Response(
        JSON.stringify({ received: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...WEBHOOK_CORS_HEADERS } }
      );
    }

    // Handle checkout.session.expired
    if (event.type === "checkout.session.expired") {
      const expiredSession = event.data.object as Stripe.Checkout.Session;
      const expiredOrderId = expiredSession.metadata?.orderId;

      if (expiredOrderId) {
        const { data: expiredOrder } = await supabase
          .from("orders")
          .select("id")
          .eq("order_id", expiredOrderId)
          .maybeSingle();

        if (expiredOrder) {
          await supabase
            .from("orders")
            .update({ payment_status: "cancelled", updated_at: new Date().toISOString() })
            .eq("id", expiredOrder.id);
        }

        await logTransaction(supabase, {
          event_type: "checkout.session.expired",
          stripe_event_id: event.id,
          order_id: expiredOrderId,
          order_uuid: expiredOrder?.id,
          buyer_email: expiredSession.customer_email || expiredSession.metadata?.buyerEmail || undefined,
          amount: expiredSession.amount_total || 0,
          currency: expiredSession.currency || "usd",
          payment_status: "cancelled",
          metadata: { sessionId: expiredSession.id },
        });
      }

      console.log(`Checkout session expired: ${expiredSession.id}`);

      return new Response(
        JSON.stringify({ received: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...WEBHOOK_CORS_HEADERS } }
      );
    }

    // Unhandled events
    console.log(`Event ${event.type} received but not handled`);

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...WEBHOOK_CORS_HEADERS } }
    );
  } catch (error) {
    console.error("Webhook handler error:", error);

    return new Response(
      JSON.stringify({
        received: true,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...WEBHOOK_CORS_HEADERS } }
    );
  }
});
