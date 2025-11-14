import { useState, useEffect } from "react";
import {
  User,
  Mail,
  ChevronLeft,
  LogOut,
  Ticket as TicketIcon,
  Wallet,
  Send,
  Download,
  AlertCircle,
  CheckCircle,
  MapPin,
  Edit2,
  Save,
  X,
  Shield,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useRouter } from "../hooks/useRouter";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { api, Ticket, Transaction } from "../utils/api";
import { QRCodeComponent } from "../components/media";
import { CurrencySelector, MultiCurrencyBalance } from "../components/payment";
import { Currency, formatCurrency } from "../utils/currency";
import { LanguageSelector } from "../components/common";
import { toast } from "sonner";

export function ProfilePage() {
  const { navigate } = useRouter();
  const { user, signOut, refreshUser } = useAuth();
  const { t } = useLanguage();
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
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("USD");
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [address, setAddress] = useState(user?.address || "");
  const [savingAddress, setSavingAddress] = useState(false);

  // Sync selected currency with user preference
  useEffect(() => {
    if (user?.preferredCurrency) {
      setSelectedCurrency(user.preferredCurrency);
    }
  }, [user?.preferredCurrency]);

  // Sync address with user data
  useEffect(() => {
    if (user?.address && user.address.trim() !== "") {
      setAddress(user.address);
      setIsEditingAddress(false);
    } else {
      setAddress("");
      setIsEditingAddress(true);
    }
  }, [user?.address]);

  const handleCurrencyChange = async (currency: Currency) => {
    setSelectedCurrency(currency);
    try {
      await api.updateCurrency(currency);
      await refreshUser();
    } catch (error) {
      console.error("Error updating currency:", error);
    }
  };

  const handleSaveAddress = async () => {
    if (!address || address.trim() === "") {
      toast.error("Por favor ingresa una dirección válida");
      return;
    }
    setSavingAddress(true);
    try {
      await api.updateAddress(address.trim());
      await refreshUser();
      setIsEditingAddress(false);
      toast.success("Dirección guardada correctamente");
    } catch (error) {
      console.error("Error updating address:", error);
      toast.error("Error al guardar la dirección. Intenta de nuevo.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleCancelEditAddress = () => {
    if (savingAddress) return;
    setAddress(user?.address || "");
    setIsEditingAddress(false);
    toast("Edición de dirección cancelada");
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

  const activeTickets = tickets.filter((t) => t.status === "active");
  const usedTickets = tickets.filter((t) => t.status === "used");

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-white/20 bg-black">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("home")}
            className="gap-2 !text-white hover:!bg-white/10"
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
            <Card className="p-6 !bg-black border-white/20">
              <div className="mb-6 text-center">
                <Avatar className="mx-auto mb-4 h-24 w-24">
                  <AvatarFallback className="bg-gradient-to-br from-[#c61619] to-[#a01316] text-2xl text-white">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mb-1 text-white">{user.name}</h2>
                <p className="text-sm text-white/70">{user.email}</p>
              </div>

              <Separator className="my-6 bg-white/20" />

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

              <Separator className="my-6 bg-white/20" />

              {/* Dirección del Usuario */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="!text-white flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Dirección
                  </Label>
                  {!isEditingAddress ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingAddress(true)}
                      className="h-8 px-2 !text-white/70 hover:!text-white hover:!bg-white/10"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span className="ml-1">
                        {user?.address ? "Editar" : "Agregar"}
                      </span>
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSaveAddress}
                        disabled={savingAddress}
                        className="h-8 px-2 !text-green-400 hover:!text-green-300 hover:!bg-green-500/10"
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEditAddress}
                        disabled={savingAddress}
                        className="h-8 px-2 !text-red-400 hover:!text-red-300 hover:!bg-red-500/10"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                {isEditingAddress ? (
                  <div className="space-y-2">
                    <Input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveAddress();
                        } else if (e.key === "Escape") {
                          handleCancelEditAddress();
                        }
                      }}
                      placeholder="Ingresa tu dirección completa"
                      className="!bg-black border-white/20 !text-white placeholder:!text-white/50"
                    />
                    <p className="text-xs !text-white/60">
                      Presiona Enter para guardar o Esc para cancelar. Esta
                      dirección se usará para tus compras.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-white/20 bg-black/50 p-3">
                    <p className="text-sm !text-white/90">
                      {user?.address || "No has agregado una dirección"}
                    </p>
                  </div>
                )}
              </div>

              <Separator className="my-6 bg-white/20" />

              {/* Multi-Currency Balance */}
              <div className="mb-6">
                <MultiCurrencyBalance
                  balance={user.balance}
                  selectedCurrency={selectedCurrency}
                  showAllCurrencies={true}
                />
              </div>

              <Button
                className="mb-4 w-full bg-[#c61619] hover:bg-[#a01316] text-white"
                onClick={() => navigate("add-balance")}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Agregar Saldo
              </Button>

              {/* Botón para hosters - Validar Entradas */}
              {(user?.role === "hoster" || user?.role === "admin") && (
                <>
                  <Separator className="my-6 bg-white/20" />
                  <Button
                    className="mb-4 w-full bg-[#c61619] hover:bg-[#a01316] text-white"
                    onClick={() => navigate("hoster-validate")}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Validar Entradas
                  </Button>
                </>
              )}

              <Separator className="my-6 bg-white/20" />

              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start !text-white hover:!bg-white/10"
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
            {/* Botón destacado para Mis Boletas */}
            <Card className="mb-6 p-4 !bg-gradient-to-r !from-[#c61619]/20 !to-[#c61619]/10 border-[#c61619]/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {t("profile.my_tickets_page")}
                  </h3>
                  <p className="text-sm text-white/70">
                    {t("profile.my_tickets_desc")}
                  </p>
                </div>
                <Button
                  onClick={() => navigate("my-tickets")}
                  className="bg-[#c61619] hover:bg-[#a01316] text-white"
                >
                  <TicketIcon className="h-4 w-4 mr-2" />
                  {t("profile.view_my_tickets")}
                </Button>
              </div>
            </Card>

            <Tabs defaultValue="tickets" className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-2 !bg-black/50 border border-white/20">
                <TabsTrigger
                  value="tickets"
                  className="!text-white data-[state=active]:!bg-[#c61619] data-[state=active]:!text-white"
                >
                  Mis Tickets ({activeTickets.length})
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="!text-white data-[state=active]:!bg-[#c61619] data-[state=active]:!text-white"
                >
                  Historial
                </TabsTrigger>
              </TabsList>

              {/* Tickets Tab */}
              <TabsContent value="tickets">
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-white/70">Cargando tickets...</p>
                  </div>
                ) : activeTickets.length === 0 ? (
                  <Card className="p-12 text-center !bg-black border-white/20">
                    <TicketIcon className="mx-auto mb-4 h-12 w-12 text-white/40" />
                    <h3 className="mb-2 font-semibold text-white">
                      No tienes tickets
                    </h3>
                    <p className="mb-6 text-white/70">
                      Explora eventos y compra tus primeros tickets
                    </p>
                    <Button
                      onClick={() => navigate("events")}
                      className="bg-[#c61619] hover:bg-[#a01316] text-white"
                    >
                      Explorar Eventos
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {activeTickets.map((ticket) => (
                      <Card
                        key={ticket.id}
                        className="overflow-hidden !bg-black border-white/20"
                      >
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
                                <h3 className="mb-2 font-semibold text-white">
                                  {ticket.eventTitle}
                                </h3>
                                <p className="mb-1 text-sm text-white/70">
                                  {ticket.eventDate}
                                </p>
                                <p className="text-sm text-white/70">
                                  {ticket.eventLocation}
                                </p>
                              </div>
                              <Badge
                                variant="secondary"
                                className="!bg-white/10 !text-white border-white/20"
                              >
                                Asiento {ticket.seatNumber}
                              </Badge>
                            </div>

                            <Separator className="my-4 bg-white/20" />

                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleRequestDownload(ticket)}
                                className="bg-[#c61619] hover:bg-[#a01316] text-white"
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
                                className="border-white/20 !text-white hover:!bg-white/10"
                              >
                                <Send className="mr-2 h-4 w-4" />
                                Transferir
                              </Button>
                            </div>

                            {ticket.transferredFrom && (
                              <div className="mt-3 flex items-center gap-2 text-sm text-[#c61619]">
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
                <Card className="p-6 !bg-black border-white/20">
                  <h3 className="mb-4 font-semibold text-white">
                    Historial de Transacciones
                  </h3>
                  {loading ? (
                    <p className="text-center text-white/70">Cargando...</p>
                  ) : transactions.length === 0 ? (
                    <p className="text-center text-white/70">
                      No hay transacciones aún
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between border-b border-white/20 pb-3 last:border-0"
                        >
                          <div>
                            <p className="font-medium text-white">
                              {transaction.description}
                            </p>
                            <p className="text-sm text-white/70">
                              {new Date(transaction.date).toLocaleDateString(
                                "es-MX",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </p>
                          </div>
                          <span
                            className={`font-semibold ${transaction.amount >= 0 ? "text-green-400" : "text-red-400"}`}
                          >
                            {transaction.amount >= 0 ? "+" : ""}
                            {transaction.amount.toLocaleString()} MXN
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {usedTickets.length > 0 && (
                    <>
                      <Separator className="my-6 bg-white/20" />
                      <h3 className="mb-4 font-semibold text-white">
                        Tickets Usados
                      </h3>
                      <div className="space-y-3">
                        {usedTickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            className="flex items-center justify-between border-b border-white/20 pb-3 last:border-0"
                          >
                            <div>
                              <p className="font-medium text-white">
                                {ticket.eventTitle}
                              </p>
                              <p className="text-sm text-white/70">
                                Usado el{" "}
                                {new Date(ticket.usedAt!).toLocaleDateString(
                                  "es-MX",
                                )}
                              </p>
                            </div>
                            <Badge
                              variant="secondary"
                              className="!bg-white/10 !text-white border-white/20"
                            >
                              Completado
                            </Badge>
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
        <DialogContent className="!bg-black border-white/20">
          <DialogHeader>
            <DialogTitle className="!text-white">Transferir Ticket</DialogTitle>
            <DialogDescription className="!text-white/70">
              Ingresa el correo electrónico de la persona a quien deseas
              transferir este ticket
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedTicket && (
              <div className="rounded-lg border border-white/20 bg-black/50 p-4">
                <p className="font-medium text-white">
                  {selectedTicket.eventTitle}
                </p>
                <p className="text-sm text-white/70">
                  Asiento: {selectedTicket.seatNumber}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="recipient-email" className="!text-white">
                Correo del Destinatario
              </Label>
              <Input
                id="recipient-email"
                type="email"
                placeholder="ejemplo@email.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="!bg-black border-white/20 !text-white placeholder:!text-white/50"
              />
            </div>

            {transferError && (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
                {transferError}
              </div>
            )}

            <div className="rounded-lg border border-[#c61619]/50 bg-[#c61619]/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-[#c61619]" />
                <div className="text-sm text-white/90">
                  <p className="font-medium">Importante</p>
                  <p>
                    Una vez transferido, no podrás recuperar este ticket. La
                    persona que lo reciba será la nueva propietaria.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 !text-white hover:!bg-white/10"
                onClick={() => {
                  setShowTransferModal(false);
                  setRecipientEmail("");
                  setTransferError("");
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-[#c61619] hover:bg-[#a01316] text-white"
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
        <DialogContent className="max-w-md !bg-black border-white/20">
          <DialogHeader>
            <DialogTitle className="!text-white">Tu Ticket</DialogTitle>
            <DialogDescription className="!text-white/70">
              Presenta este código QR en la entrada del evento
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              <div className="rounded-lg border border-white/20 bg-black/50 p-6 text-center">
                <QRCodeComponent value={selectedTicket.qrCode} size={200} />
                <p className="mt-4 font-semibold text-white">
                  {selectedTicket.eventTitle}
                </p>
                <p className="text-sm text-white/70">
                  Asiento: {selectedTicket.seatNumber}
                </p>
                <p className="text-sm text-white/70">
                  {selectedTicket.eventDate}
                </p>
              </div>

              <div className="rounded-lg border border-[#c61619]/50 bg-[#c61619]/10 p-4 text-sm text-white/90">
                <p className="font-medium">Código de verificación generado</p>
                <p className="break-all font-mono text-xs text-white/70">
                  {downloadToken}
                </p>
                <p className="mt-2 text-xs text-white/70">
                  Este código expira en 15 minutos. En producción se enviaría
                  por email.
                </p>
              </div>

              <Button
                className="w-full bg-[#c61619] hover:bg-[#a01316] text-white"
                onClick={() => setShowQRModal(false)}
              >
                Cerrar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
