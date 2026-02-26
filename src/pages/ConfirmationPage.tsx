import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  Download,
  Home,
  Ticket,
  Calendar,
  MapPin,
  CreditCard,
  Loader2,
  XCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { useRouter } from "../hooks/useRouter";
import { useAuth } from "../hooks/useAuth";
import { QRCodeComponent } from "../components/media";
import { Badge } from "../components/ui/badge";
import { motion } from "motion/react";
import { TicketComponent } from "../components/tickets/TicketComponent";
import { Ticket as TicketType } from "../utils/tickets/ticketService";
import { stripeService } from "../services/stripe";
import { getSupabaseClient } from "../utils/supabase/client";
import { env } from "../config/env";

/** Get the current user's JWT or fall back to the anon key */
async function getAuthToken(): Promise<string> {
  try {
    const { data } = await getSupabaseClient().auth.getSession();
    if (data.session?.access_token) return data.session.access_token;
  } catch { /* ignore */ }
  return env.supabase.anonKey;
}

export function ConfirmationPage() {
  const { navigate, pageData } = useRouter();
  const { user } = useAuth();

  // Obtener parámetros de URL de Stripe
  const urlParams = new URLSearchParams(window.location.hash.split("?")[1] || "");
  const sessionId: string | null =
    (pageData as any)?.session_id ||
    urlParams.get("session_id") ||
    null;

  // Verificar si el pago fue cancelado o falló
  const paymentCanceled = urlParams.get("canceled") === "true";

  // Debug removed for security

  // Si el pago fue cancelado, redirigir a payment-failed
  React.useEffect(() => {
    if (paymentCanceled) {
      navigate("payment-failed", {
        error: "Pago cancelado por el usuario",
        session_id: sessionId,
      });
    }
  }, [paymentCanceled, sessionId, navigate]);

  // Solo redirigir si NO hay sessionId
  if (!pageData && !sessionId) {
    navigate("home");
    return null;
  }

  const orderId: string | null =
    (pageData as any)?.order || (pageData as any)?.orderId || null;

  const [fetchedTickets, setFetchedTickets] = useState<TicketType[] | null>(
    null,
  );
  const [polling, setPolling] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      // Si hay session_id de Stripe, verificar la sesión
      if (sessionId && stripeService.isConfigured()) {
        const result = await stripeService.verifySession(sessionId);

        // Verificar si hubo un error en el pago (pero ignorar errores 401 que son de autenticación)
        if (!result.ok) {
          // Si es error 401, intentar con el endpoint de orders-tickets directamente
          if (result.error?.includes("401") || result.error?.includes("authorization")) {
            // Continuar con el flujo normal de polling
            setChecking(false);
            return;
          }
          
          setPaymentError(result.error || "Error al verificar el pago");
          setChecking(false);
          // Redirigir a página de error después de 2 segundos
          setTimeout(() => {
            navigate("payment-failed", {
              error: result.error || "Error al verificar el pago",
              session_id: sessionId,
            });
          }, 2000);
          return;
        }

        // Verificar si el pago fue rechazado o no completado
        if (!result.isPaid) {
          setPaymentError("El pago no fue completado o fue rechazado");
          setChecking(false);
          // Redirigir a página de error
          setTimeout(() => {
            navigate("payment-failed", {
              error: "El pago no fue completado o fue rechazado por tu banco",
              session_id: sessionId,
            });
          }, 2000);
          return;
        }

        if (result.ok && result.tickets && result.tickets.length > 0) {
          setFetchedTickets(result.tickets);
          setPolling(false);
          setChecking(false);
          return;
        }
        // Si hay orderId de la sesión, usarlo para buscar tickets
        if (result.ok && result.orderId) {
          const orderIdToUse = result.orderId;
          const projectUrl = import.meta.env.VITE_SUPABASE_PROJECT_URL || import.meta.env.VITE_supabase_project_url || `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || import.meta.env.VITE_supabase_project_id}.supabase.co`;
          const token = await getAuthToken();
          const res = await fetch(
            `${projectUrl}/functions/v1/orders-tickets/${encodeURIComponent(orderIdToUse)}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          if (res.ok) {
            const json = await res.json();
            if (json?.ok && Array.isArray(json.tickets) && json.tickets.length > 0) {
              setFetchedTickets(json.tickets);
              setPolling(false);
            }
          }
          setChecking(false);
          return;
        }
      }

      // Fallback: usar orderId directamente
      if (!orderId) {
        setChecking(false);
        return;
      }

      // Usar Edge Function de Supabase en lugar de Cloudflare
      const projectUrl = import.meta.env.VITE_SUPABASE_PROJECT_URL || import.meta.env.VITE_supabase_project_url || `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || import.meta.env.VITE_supabase_project_id}.supabase.co`;
      const token2 = await getAuthToken();
      const res = await fetch(
        `${projectUrl}/functions/v1/orders-tickets/${encodeURIComponent(orderId)}`,
        {
          headers: {
            Authorization: `Bearer ${token2}`,
          },
        },
      );
      if (res.ok) {
        const json = await res.json();
        if (
          json?.ok &&
          Array.isArray(json.tickets) &&
          json.tickets.length > 0
        ) {
          setFetchedTickets(json.tickets);
          setPolling(false);
        }
      }
    } catch {
      // silencioso
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Si hay session_id de Stripe, verificar la sesión primero
    if (sessionId && stripeService.isConfigured()) {
      const verifyStripeSession = async () => {
        try {
          const result = await stripeService.verifySession(sessionId);

          // Si hubo error o el pago no fue completado, redirigir
          // PERO ignorar errores 401 que son de autenticación, no de pago
          if (!result.ok) {
            if (result.error?.includes("401") || result.error?.includes("authorization")) {
              return; // Continuar con polling normal
            }
            
            setPaymentError(result.error || "El pago no fue completado");
            setTimeout(() => {
              navigate("payment-failed", {
                error: result.error || "El pago no fue completado correctamente",
                session_id: sessionId,
              });
            }, 2000);
            return;
          }
          
          if (!result.isPaid) {
            setPaymentError("El pago no fue completado");
            setTimeout(() => {
              navigate("payment-failed", {
                error: "El pago no fue completado o fue rechazado por tu banco",
                session_id: sessionId,
              });
            }, 2000);
            return;
          }

          if (result.ok && result.isComplete && result.tickets) {
            setFetchedTickets(result.tickets);
            setPolling(false);
            return;
          }
          // Si la sesión está pagada pero no hay tickets aún, usar orderId para polling
          if (result.ok && result.isPaid && result.orderId) {
            // Continuar con el polling normal usando orderId
          }
        } catch (error) {
          setPaymentError("Error al verificar el estado del pago");
        }
      };
      verifyStripeSession();
    }

    // Polling normal por orderId (para Cryptomus o si Stripe aún no tiene tickets)
    if (!orderId || (pageData as any)?.tickets) return;

    let active = true;
    setPolling(true);

    const fetchTickets = async () => {
      try {
        // Usar Edge Function de Supabase en lugar de Cloudflare
        const projectUrl = import.meta.env.VITE_SUPABASE_PROJECT_URL || import.meta.env.VITE_supabase_project_url || `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || import.meta.env.VITE_supabase_project_id}.supabase.co`;
        const token = await getAuthToken();
        const res = await fetch(
          `${projectUrl}/functions/v1/orders-tickets/${encodeURIComponent(orderId)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (!active) return;
        if (res.ok) {
          const json = await res.json();
          if (
            json?.ok &&
            Array.isArray(json.tickets) &&
            json.tickets.length > 0
          ) {
            setFetchedTickets(json.tickets);
            setPolling(false);
          }
        }
      } catch {
        // silencio: reintento en próximo intervalo
      }
    };

    fetchTickets();
    const id = setInterval(fetchTickets, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [orderId, sessionId, (pageData as any)?.tickets]);

  // Derivar valores efectivos
  const tickets: TicketType[] | null =
    (pageData as any)?.tickets || fetchedTickets || null;
  const quantity: number =
    (pageData as any)?.quantity || (tickets ? tickets.length : 0);
  const total: number =
    (pageData as any)?.total ||
    (tickets
      ? tickets.reduce(
          (acc: number, t: any) => acc + (t.price_paid ?? t.price ?? 0),
          0,
        )
      : 0);
  
  // Determinar método de pago
  const getPaymentMethod = (): string => {
    // Si hay sessionId de Stripe, el pago fue con tarjeta
    if (sessionId) {
      return "Tarjeta de Crédito/Débito (Stripe)";
    }
    // Si hay tickets, revisar el primer ticket
    if (tickets && tickets.length > 0) {
      const firstTicket = tickets[0] as any;
      // payment_method_id puede indicar el método
      // UUID "11111111-1111-1111-1111-111111111111" es Stripe
      if (firstTicket.payment_method_id === "11111111-1111-1111-1111-111111111111") {
        return "Tarjeta de Crédito/Débito (Stripe)";
      }
      // UUID "22222222-2222-2222-2222-222222222222" es Cryptomus
      if (firstTicket.payment_method_id === "22222222-2222-2222-2222-222222222222") {
        return "Criptomonedas (Cryptomus)";
      }
    }
    // Default
    return "Saldo Interno";
  };
  
  const paymentMethod = getPaymentMethod();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Error Alert si hay un error de pago */}
            {paymentError && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-1 font-semibold text-red-900 dark:text-red-200">
                        Error en el pago
                      </h3>
                      <p className="text-sm text-red-800 dark:text-red-300">
                        {paymentError}
                      </p>
                      <p className="mt-2 text-xs text-red-700 dark:text-red-400">
                        Serás redirigido a la página de error en unos segundos...
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Success Header */}
            <div className="mb-10 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-2xl"
              >
                <CheckCircle className="h-14 w-14 text-white" strokeWidth={2} />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mb-4 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl"
              >
                ¡Compra exitosa!
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-xl text-gray-600 dark:text-gray-400"
              >
                {quantity > 1
                  ? `Tus ${quantity} tickets han sido generados correctamente`
                  : "Tu ticket ha sido generado correctamente"}
              </motion.p>
            </div>

            {/* Purchase Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card className="mb-8 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                    <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                    Resumen de compra
                  </h2>
                  <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1">
                    Completado
                  </Badge>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  {/* ID de Transacción */}
                  {(orderId || (tickets && tickets[0] && (tickets[0] as any).purchase_id)) && (
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <span className="text-xs font-medium text-blue-900 dark:text-blue-200">
                            ID de Transacción
                          </span>
                          <p className="mt-1 font-mono text-sm font-semibold text-blue-800 dark:text-blue-300 break-all">
                            {orderId || (tickets && tickets[0] && (tickets[0] as any).purchase_id)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Session ID de Stripe */}
                  {sessionId && (
                    <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <span className="text-xs font-medium text-purple-900 dark:text-purple-200">
                            ID de Sesión Stripe
                          </span>
                          <p className="mt-1 font-mono text-xs text-purple-800 dark:text-purple-300 break-all">
                            {sessionId}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator className="my-3" />

                  {/* Total Pagado */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Total Pagado
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ${total.toLocaleString()} USD
                    </span>
                  </div>

                  {/* Método de Pago */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Método de Pago
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {paymentMethod}
                    </span>
                  </div>

                  {/* Cantidad de Boletos */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Cantidad de Boletos
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {quantity} {quantity === 1 ? "boleto" : "boletos"}
                    </span>
                  </div>

                  {/* Fecha de Compra */}
                  {tickets && tickets.length > 0 && (tickets[0] as any).purchase_date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Fecha de Compra
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date((tickets[0] as any).purchase_date).toLocaleDateString("es-MX", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}

                  {/* Email del comprador */}
                  {tickets && tickets.length > 0 && (tickets[0] as any).buyer_email && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Email de Confirmación
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white break-all text-right">
                        {(tickets[0] as any).buyer_email}
                      </span>
                    </div>
                  )}

                  {/* Saldo Restante (solo para Saldo Interno) */}
                  {user && paymentMethod === "Saldo Interno" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Saldo Restante
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${user.balance.toLocaleString()} USD
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Tickets */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mb-8 space-y-4"
            >
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Ticket className="h-5 w-5 text-green-600 dark:text-green-400" />
                {quantity > 1 ? "Tus tickets" : "Tu ticket"}
              </h2>

              {tickets && tickets.length > 0 ? (
                tickets.map((ticket: TicketType, index: number) => (
                  <div key={ticket.id} className="mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                      {/* Header del ticket con número */}
                      <div className="bg-black px-4 py-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-semibold">
                            Boleto #{index + 1} de {tickets.length}
                          </h3>
                          <Badge className="bg-white/20 text-white border-white/30">
                            {(ticket as any).status === "issued_unused" ? "Válido" : (ticket as any).status}
                          </Badge>
                        </div>
                      </div>

                      {/* Detalles adicionales del ticket */}
                      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          {/* Código del Boleto */}
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 block mb-1">Código de Boleto</span>
                            <span className="font-mono font-semibold text-gray-900 dark:text-white">
                              {ticket.ticket_code}
                            </span>
                          </div>

                          {/* ID del Boleto */}
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 block mb-1">ID del Boleto</span>
                            <span className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">
                              {ticket.id}
                            </span>
                          </div>

                          {/* Fecha de emisión */}
                          {(ticket as any).created_at && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block mb-1">Fecha de Emisión</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {new Date((ticket as any).created_at).toLocaleDateString("es-MX", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          )}

                          {/* Precio pagado */}
                          {(ticket as any).price_paid && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block mb-1">Precio</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                ${((ticket as any).price_paid).toLocaleString()} USD
                              </span>
                            </div>
                          )}

                          {/* Clase/Tipo de boleto */}
                          {(ticket as any).ticket_class && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block mb-1">Categoría</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {(ticket as any).ticket_class}
                              </span>
                            </div>
                          )}

                          {/* Tipo de asiento */}
                          {(ticket as any).seat_type && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block mb-1">Tipo de Asiento</span>
                              <span className="font-medium text-gray-900 dark:text-white capitalize">
                                {(ticket as any).seat_type}
                              </span>
                            </div>
                          )}

                          {/* Número de asiento si existe */}
                          {(ticket as any).seat_number && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block mb-1">Asiento</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {(ticket as any).seat_number}
                              </span>
                            </div>
                          )}

                          {/* Puerta si existe */}
                          {(ticket as any).gate_number && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block mb-1">Puerta</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                Puerta {(ticket as any).gate_number}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Componente de ticket visual */}
                      <TicketComponent
                        ticket={ticket}
                        onPrint={() => window.print()}
                      />
                    </div>
                  </div>
                ))
              ) : orderId ? (
                <Card className="p-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                      <Loader2
                        className={`h-5 w-5 text-blue-600 dark:text-blue-400 ${polling || checking ? "animate-spin" : ""}`}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-1 font-semibold text-blue-900 dark:text-blue-200">
                        {polling || checking
                          ? "Generando tus tickets..."
                          : "Aún no hay tickets disponibles"}
                      </h3>
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        {polling || checking
                          ? "Estamos confirmando tu pago en la red y generando tus tickets. Esto puede tomar algunos minutos."
                          : "Tu pago ha sido recibido. Puedes verificar manualmente si los tickets ya están disponibles."}
                      </p>
                      <div className="mt-3 text-xs text-blue-700 dark:text-blue-300">
                        <span className="font-medium">ID de orden:</span>{" "}
                        <code className="break-all">{orderId}</code>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <Button
                          onClick={handleManualCheck}
                          disabled={checking}
                          className="bg-black hover:bg-gray-800 text-white"
                        >
                          {checking ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Verificando...
                            </>
                          ) : (
                            "Verificar ahora"
                          )}
                        </Button>
                        <span className="text-xs text-blue-700 dark:text-blue-300">
                          Se verifica automáticamente cada 5 segundos
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : null}
            </motion.div>

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Card className="mb-8 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/40 flex-shrink-0">
                    <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 font-semibold text-green-900 dark:text-green-200">
                      Accede a tus tickets en cualquier momento
                    </h3>
                    <p className="text-sm text-green-800 dark:text-green-300 mb-3">
                      Tus tickets están guardados de forma segura en tu perfil.
                      Podrás visualizarlos, descargarlos o transferirlos cuando lo necesites.
                    </p>
                    <ul className="space-y-2 text-sm text-green-800 dark:text-green-300">
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-400 flex-shrink-0" />
                        <span>Disponibles en la sección "Mis Tickets" de tu perfil</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-400 flex-shrink-0" />
                        <span>Puedes transferirlos a otros usuarios por email</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-400 flex-shrink-0" />
                        <span>El código QR es único y será validado en el evento</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Button
                className="flex-1 bg-black hover:bg-gray-800 text-white h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
                onClick={() => navigate("profile")}
              >
                <Ticket className="mr-2 h-5 w-5" />
                Ver mis tickets
              </Button>
              <Button
                className="flex-1 bg-black hover:bg-gray-800 text-white h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
                onClick={() => navigate("home")}
              >
                <Home className="mr-2 h-5 w-5" />
                Volver al inicio
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
