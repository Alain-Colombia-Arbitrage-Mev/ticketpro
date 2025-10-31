import { CheckCircle, Download, Home, Ticket, Calendar, MapPin, CreditCard } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { useRouter } from "../hooks/useRouter";
import { useAuth } from "../hooks/useAuth";
import { QRCodeComponent } from "../components/media";
import { Badge } from "../components/ui/badge";
import { motion } from "motion/react";

export function ConfirmationPage() {
  const { navigate, pageData } = useRouter();
  const { user } = useAuth();

  if (!pageData) {
    navigate("home");
    return null;
  }

  const { tickets, total, quantity } = pageData;

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
                Tu {quantity > 1 ? `${quantity} tickets han` : "ticket ha"} sido {quantity > 1 ? "comprados" : "comprado"} exitosamente
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
                    <span className="text-gray-600 dark:text-gray-400">Total Pagado</span>
                    <span className="font-semibold text-gray-900 dark:text-white">${total.toLocaleString()} MXN</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Método de Pago</span>
                    <span className="font-medium text-gray-900 dark:text-white">Saldo Interno</span>
                  </div>
                  {user && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Saldo Restante</span>
                      <span className="font-medium text-gray-900 dark:text-white">${user.balance.toLocaleString()} MXN</span>
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

              {tickets?.map((ticket: any, index: number) => (
                <Card key={ticket.id} className="overflow-hidden border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                  <div className="flex flex-col md:flex-row">
                    {/* QR Code Section */}
                    <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 dark:from-blue-900/20 to-purple-50 dark:to-purple-900/20 p-6 md:w-64 md:border-b-0 md:border-r">
                      <div className="mb-4 text-center">
                        <QRCodeComponent value={ticket.qrCode} size={180} />
                      </div>
                      <div className="text-center">
                        <Badge variant="secondary" className="mb-2">
                          Asiento {ticket.seatNumber}
                        </Badge>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Presenta este código en la entrada</p>
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 p-6">
                      <div className="mb-4">
                        <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{ticket.eventTitle}</h3>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{ticket.eventDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{ticket.eventLocation}</span>
                          </div>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">ID del Ticket</span>
                        <span className="font-mono text-xs text-gray-900 dark:text-white">{ticket.id}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
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
                    <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-200">Accede a tus tickets</h3>
                    <p className="mb-3 text-sm text-blue-800 dark:text-blue-300">
                      Puedes ver y descargar tus tickets en cualquier momento desde tu perfil.
                      También puedes transferirlos a otra persona si es necesario.
                    </p>
                    <ul className="list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-300">
                      <li>Los tickets están disponibles en la sección "Mis Tickets"</li>
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
