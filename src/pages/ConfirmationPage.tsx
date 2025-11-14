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

export function ConfirmationPage() {
  const { navigate, pageData } = useRouter();
  const { user } = useAuth();

  if (!pageData) {
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

  const handleManualCheck = async () => {
    if (!orderId) return;
    setChecking(true);
    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(orderId)}/tickets`,
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
    if (!orderId || (pageData as any)?.tickets) return;

    let active = true;
    setPolling(true);

    const fetchTickets = async () => {
      try {
        const res = await fetch(
          `/api/orders/${encodeURIComponent(orderId)}/tickets`,
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
  }, [orderId, (pageData as any)?.tickets]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 dark:from-gray-900 via-blue-50 dark:via-gray-900 to-purple-50 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Success Header */}
            <div className="mb-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg"
              >
                <CheckCircle className="h-10 w-10 text-white" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mb-3 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl"
              >
                ¡Compra Exitosa!
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-lg text-gray-600 dark:text-gray-400"
              >
                Tu {quantity > 1 ? `${quantity} tickets han` : "ticket ha"} sido{" "}
                {quantity > 1 ? "comprados" : "comprado"} exitosamente
              </motion.p>
            </div>

            {/* Purchase Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="mb-6 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                    <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Resumen de Compra
                  </h2>
                  <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                    Pagado
                  </Badge>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Total Pagado
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ${total.toLocaleString()} MXN
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Método de Pago
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Saldo Interno
                    </span>
                  </div>
                  {user && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Saldo Restante
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${user.balance.toLocaleString()} MXN
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
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mb-6 space-y-4"
            >
              <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <Ticket className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                {quantity > 1 ? "Tus Tickets" : "Tu Ticket"}
              </h2>

              {tickets && tickets.length > 0 ? (
                tickets.map((ticket: TicketType) => (
                  <div key={ticket.id} className="mb-6">
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
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
                          className="bg-blue-600 hover:bg-blue-700 text-white"
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
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-6">
                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                  <div className="flex-1">
                    <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-200">
                      Accede a tus tickets
                    </h3>
                    <p className="mb-3 text-sm text-blue-800 dark:text-blue-300">
                      Puedes ver y descargar tus tickets en cualquier momento
                      desde tu perfil. También puedes transferirlos a otra
                      persona si es necesario.
                    </p>
                    <ul className="list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-300">
                      <li>
                        Los tickets están disponibles en la sección "Mis
                        Tickets"
                      </li>
                      <li>Puedes transferirlos a otros usuarios por email</li>
                      <li>El código QR es único y se validará en la entrada</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Button
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm hover:shadow-md"
                onClick={() => navigate("profile")}
              >
                <Ticket className="mr-2 h-4 w-4" />
                Ver Mis Tickets
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate("home")}
              >
                <Home className="mr-2 h-4 w-4" />
                Volver al Inicio
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
