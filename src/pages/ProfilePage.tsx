import { useState, useEffect } from "react";
import { User, Mail, ChevronLeft, LogOut, Ticket as TicketIcon, Wallet, Send, Download, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useRouter } from "../hooks/useRouter";
import { useAuth } from "../hooks/useAuth";
import { api, Ticket, Transaction } from "../utils/api";
import { QRCodeComponent } from "../components/QRCodeComponent";
import { CurrencySelector } from "../components/CurrencySelector";
import { MultiCurrencyBalance } from "../components/MultiCurrencyBalance";
import { Currency, formatCurrency } from "../utils/currency";
import { LanguageSelector } from "../components/LanguageSelector";

export function ProfilePage() {
  const { navigate } = useRouter();
  const { user, signOut, refreshUser } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [downloadToken, setDownloadToken] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');

  // Sync selected currency with user preference
  useEffect(() => {
    if (user?.preferredCurrency) {
      setSelectedCurrency(user.preferredCurrency);
    }
  }, [user?.preferredCurrency]);

  const handleCurrencyChange = async (currency: Currency) => {
    setSelectedCurrency(currency);
    try {
      await api.updateCurrency(currency);
      await refreshUser();
    } catch (error) {
      console.error("Error updating currency:", error);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("login");
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ticketsData, transactionsData] = await Promise.all([
        api.getMyTickets(),
        api.getTransactions(),
      ]);
      setTickets(ticketsData.tickets);
      setTransactions(transactionsData.transactions);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedTicket || !recipientEmail) return;

    setTransferLoading(true);
    setTransferError("");

    try {
      await api.transferTicket(selectedTicket.id, recipientEmail);
      setShowTransferModal(false);
      setRecipientEmail("");
      setSelectedTicket(null);
      await loadData();
    } catch (error: any) {
      setTransferError(error.message || "Error al transferir ticket");
    } finally {
      setTransferLoading(false);
    }
  };

  const handleRequestDownload = async (ticket: Ticket) => {
    try {
      const result = await api.requestDownload(ticket.id);
      setDownloadToken(result.verificationToken);
      setSelectedTicket(ticket);
      setShowQRModal(true);
    } catch (error) {
      console.error("Error requesting download:", error);
    }
  };

  if (!user) {
    return null;
  }

  const activeTickets = tickets.filter(t => t.status === "active");
  const usedTickets = tickets.filter(t => t.status === "used");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("home")}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver al inicio
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar - User Info */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <div className="mb-6 text-center">
                <Avatar className="mx-auto mb-4 h-24 w-24">
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-2xl text-white">
                    {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mb-1 text-gray-900">{user.name}</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>

              <Separator className="my-6" />

              {/* Currency Selector */}
              <div className="mb-4">
                <CurrencySelector
                  selectedCurrency={selectedCurrency}
                  onCurrencyChange={handleCurrencyChange}
                  showLabel={true}
                />
              </div>

              {/* Language Selector */}
              <div className="mb-4">
                <LanguageSelector variant="default" />
              </div>

              <Separator className="my-6" />

              {/* Multi-Currency Balance */}
              <div className="mb-6">
                <MultiCurrencyBalance
                  balance={user.balance}
                  selectedCurrency={selectedCurrency}
                  showAllCurrencies={true}
                />
              </div>

              <Button
                className="mb-4 w-full"
                onClick={() => navigate("add-balance")}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Agregar Saldo
              </Button>

              <Separator className="my-6" />

              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="tickets" className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-2">
                <TabsTrigger value="tickets">Mis Tickets ({activeTickets.length})</TabsTrigger>
                <TabsTrigger value="history">Historial</TabsTrigger>
              </TabsList>

              {/* Tickets Tab */}
              <TabsContent value="tickets">
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Cargando tickets...</p>
                  </div>
                ) : activeTickets.length === 0 ? (
                  <Card className="p-12 text-center">
                    <TicketIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                    <h3 className="mb-2 font-semibold text-gray-900">No tienes tickets</h3>
                    <p className="mb-6 text-gray-600">Explora eventos y compra tus primeros tickets</p>
                    <Button onClick={() => navigate("events")}>
                      Explorar Eventos
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {activeTickets.map((ticket) => (
                      <Card key={ticket.id} className="overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          <div className="h-48 w-full md:h-auto md:w-48">
                            <img
                              src={ticket.eventImage}
                              alt={ticket.eventTitle}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="flex-1 p-6">
                            <div className="mb-4 flex items-start justify-between">
                              <div>
                                <h3 className="mb-2 font-semibold text-gray-900">{ticket.eventTitle}</h3>
                                <p className="mb-1 text-sm text-gray-600">{ticket.eventDate}</p>
                                <p className="text-sm text-gray-600">{ticket.eventLocation}</p>
                              </div>
                              <Badge variant="secondary">
                                Asiento {ticket.seatNumber}
                              </Badge>
                            </div>

                            <Separator className="my-4" />

                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleRequestDownload(ticket)}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Ver QR
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedTicket(ticket);
                                  setShowTransferModal(true);
                                }}
                              >
                                <Send className="mr-2 h-4 w-4" />
                                Transferir
                              </Button>
                            </div>

                            {ticket.transferredFrom && (
                              <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                                <CheckCircle className="h-4 w-4" />
                                <span>Recibido por transferencia</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history">
                <Card className="p-6">
                  <h3 className="mb-4 font-semibold text-gray-900">Historial de Transacciones</h3>
                  {loading ? (
                    <p className="text-center text-gray-500">Cargando...</p>
                  ) : transactions.length === 0 ? (
                    <p className="text-center text-gray-500">No hay transacciones aún</p>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                          <div>
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(transaction.date).toLocaleDateString('es-MX', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <span className={`font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toLocaleString()} MXN
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {usedTickets.length > 0 && (
                    <>
                      <Separator className="my-6" />
                      <h3 className="mb-4 font-semibold text-gray-900">Tickets Usados</h3>
                      <div className="space-y-3">
                        {usedTickets.map((ticket) => (
                          <div key={ticket.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                            <div>
                              <p className="font-medium text-gray-900">{ticket.eventTitle}</p>
                              <p className="text-sm text-gray-500">
                                Usado el {new Date(ticket.usedAt!).toLocaleDateString('es-MX')}
                              </p>
                            </div>
                            <Badge variant="secondary">Completado</Badge>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir Ticket</DialogTitle>
            <DialogDescription>
              Ingresa el correo electrónico de la persona a quien deseas transferir este ticket
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedTicket && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="font-medium text-gray-900">{selectedTicket.eventTitle}</p>
                <p className="text-sm text-gray-600">Asiento: {selectedTicket.seatNumber}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="recipient-email">Correo del Destinatario</Label>
              <Input
                id="recipient-email"
                type="email"
                placeholder="ejemplo@email.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>

            {transferError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {transferError}
              </div>
            )}

            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <div className="text-sm text-blue-900 dark:text-blue-200">
                  <p className="font-medium">Importante</p>
                  <p>Una vez transferido, no podrás recuperar este ticket. La persona que lo reciba será la nueva propietaria.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowTransferModal(false);
                  setRecipientEmail("");
                  setTransferError("");
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleTransfer}
                disabled={transferLoading || !recipientEmail}
              >
                {transferLoading ? "Transfiriendo..." : "Transferir"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tu Ticket</DialogTitle>
            <DialogDescription>
              Presenta este código QR en la entrada del evento
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
                <QRCodeComponent value={selectedTicket.qrCode} size={200} />
                <p className="mt-4 font-semibold text-gray-900">{selectedTicket.eventTitle}</p>
                <p className="text-sm text-gray-600">Asiento: {selectedTicket.seatNumber}</p>
                <p className="text-sm text-gray-600">{selectedTicket.eventDate}</p>
              </div>

              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 text-sm text-blue-900 dark:text-blue-200">
                <p className="font-medium">Código de verificación generado</p>
                <p className="break-all font-mono text-xs dark:text-blue-300">{downloadToken}</p>
                <p className="mt-2 text-xs dark:text-blue-300">
                  Este código expira en 15 minutos. En producción se enviaría por email.
                </p>
              </div>

              <Button className="w-full" onClick={() => setShowQRModal(false)}>
                Cerrar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
