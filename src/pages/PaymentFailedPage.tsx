import React from "react";
import { XCircle, Home, RefreshCcw, HelpCircle, Mail } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useRouter } from "../hooks/useRouter";
import { motion } from "motion/react";

export function PaymentFailedPage() {
  const { navigate, pageData } = useRouter();

  // Obtener información del error si existe
  const errorMessage = (pageData as any)?.error || "El pago no pudo ser procesado";
  const sessionId = (pageData as any)?.session_id ||
    new URLSearchParams(window.location.hash.split("?")[1] || "").get("session_id");

  const handleRetryPayment = () => {
    // Volver al checkout para reintentar el pago
    if (pageData) {
      navigate("checkout", pageData);
    } else {
      navigate("home");
    }
  };

  const handleContactSupport = () => {
    // Abrir email de soporte
    const subject = `Ayuda con pago fallido${sessionId ? ` - Sesión ${sessionId}` : ''}`;
    const body = `Hola,\n\nNecesito ayuda con un pago que no pudo ser procesado.\n\n${sessionId ? `ID de sesión: ${sessionId}\n` : ''}Mensaje de error: ${errorMessage}\n\nGracias.`;
    window.location.href = `mailto:support@tiquetera.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Error Header */}
            <div className="mb-10 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"
              >
                <XCircle className="h-14 w-14 text-red-600 dark:text-red-400" strokeWidth={1.5} />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mb-4 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl"
              >
                Pago no completado
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-xl text-gray-600 dark:text-gray-400"
              >
                Hubo un problema al procesar tu pago
              </motion.p>
            </div>

            {/* Error Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="mb-8 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 shadow-sm">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                      <HelpCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Detalle del error
                    </h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 ml-[52px]">
                    {errorMessage}
                  </p>
                  {sessionId && (
                    <div className="mt-4 ml-[52px] rounded-lg bg-gray-100 dark:bg-gray-900 px-4 py-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        ID de sesión
                      </p>
                      <code className="text-xs text-gray-800 dark:text-gray-200 break-all font-mono">
                        {sessionId}
                      </code>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
                    Causas comunes:
                  </h4>
                  <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
                      <span>Fondos insuficientes en la tarjeta o cuenta</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
                      <span>Datos de pago incorrectos o incompletos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
                      <span>Rechazo por parte del banco por medidas de seguridad</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
                      <span>Sesión de pago expirada por inactividad</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
                      <span>Cancelación manual del proceso</span>
                    </li>
                  </ul>
                </div>
              </Card>
            </motion.div>

            {/* Nota importante */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card className="mb-8 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 flex-shrink-0">
                    <span className="text-2xl">💡</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-200">
                      Tranquilo, no se realizó ningún cargo
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      Tu cuenta no ha sido debitada y los tickets no fueron reservados.
                      Puedes intentar realizar la compra nuevamente cuando estés listo.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Button
                className="flex-1 bg-black hover:bg-gray-800 text-white h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
                onClick={handleRetryPayment}
              >
                <RefreshCcw className="mr-2 h-5 w-5" />
                Reintentar pago
              </Button>
              <Button
                className="flex-1 bg-black hover:bg-gray-800 text-white h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
                onClick={handleContactSupport}
              >
                <Mail className="mr-2 h-5 w-5" />
                Contactar soporte
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-6 text-center"
            >
              <Button
                className="bg-black hover:bg-gray-800 text-white h-11 px-6 text-base font-semibold shadow-md hover:shadow-lg transition-all"
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
