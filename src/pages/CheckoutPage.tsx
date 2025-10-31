import { useState, useEffect } from "react";
import { ChevronLeft, Wallet, Lock, Ticket, Calendar, MapPin, Minus, Plus, AlertCircle, Sparkles, User, Mail, Phone, Users, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useRouter } from "../hooks/useRouter";
import { useAuth } from "../hooks/useAuth";
import { api } from "../utils/api";
import { CurrencySelector } from "../components/CurrencySelector";
import { Currency, formatCurrency, MultiCurrencyBalance } from "../utils/currency";

export function CheckoutPage() {
  const { navigate, pageData } = useRouter();
  const { user, refreshUser } = useAuth();
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [selectedTicketType, setSelectedTicketType] = useState("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    user?.preferredCurrency || pageData?.currency || 'USD'
  );

  // Onboarding states
  const [currentStep, setCurrentStep] = useState(1);
  const [buyerInfo, setBuyerInfo] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
  });
  const [attendees, setAttendees] = useState<Array<{ name: string; email?: string }>>([]);
  const [specialRequests, setSpecialRequests] = useState("");

  if (!pageData) {
    navigate("home");
    return null;
  }

  if (!user) {
    navigate("login");
    return null;
  }

  const ticketPrices: Record<string, number> = {
    general: parseInt(pageData.price?.replace(/[^0-9]/g, "") || "800"),
    vip: parseInt(pageData.price?.replace(/[^0-9]/g, "") || "800") * 2,
    palco: parseInt(pageData.price?.replace(/[^0-9]/g, "") || "800") * 4,
  };

  const subtotal = ticketPrices[selectedTicketType] * ticketQuantity;
  const serviceFee = subtotal * 0.1;
  const total = subtotal + serviceFee;

  // Get user balance in selected currency
  const getUserBalance = (): number => {
    if (typeof user.balance === 'number') {
      // Old format - assume MXN
      return selectedCurrency === 'MXN' ? user.balance : 0;
    }
    return (user.balance as MultiCurrencyBalance)[selectedCurrency] || 0;
  };

  const userBalance = getUserBalance();

  // Update attendees array when ticket quantity changes
  useEffect(() => {
    if (attendees.length !== ticketQuantity) {
      const newAttendees = Array.from({ length: ticketQuantity }, (_, i) => 
        attendees[i] || { name: "" }
      );
      setAttendees(newAttendees);
    }
  }, [ticketQuantity]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate buyer info
      if (!buyerInfo.fullName.trim() || !buyerInfo.email.trim()) {
        setError("Por favor completa todos los campos obligatorios");
        return;
      }
      if (!buyerInfo.email.includes("@")) {
        setError("Por favor ingresa un email válido");
        return;
      }
      // Initialize attendees array
      setAttendees(Array.from({ length: ticketQuantity }, () => ({ name: "" })));
    }
    if (currentStep === 2) {
      // Validate attendees
      const invalidAttendees = attendees.filter(a => !a.name.trim());
      if (invalidAttendees.length > 0) {
        setError("Por favor ingresa el nombre de todos los asistentes");
        return;
      }
    }
    setError("");
    setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    setError("");
    setCurrentStep(currentStep - 1);
  };

  const handleCheckout = async () => {
    // Validate onboarding is complete
    if (currentStep < 3) {
      setError("Por favor completa todos los pasos antes de realizar el pago");
      return;
    }

    if (!buyerInfo.fullName.trim() || !buyerInfo.email.trim()) {
      setError("Por favor completa la información del comprador");
      setCurrentStep(1);
      return;
    }

    const invalidAttendees = attendees.filter(a => !a.name.trim());
    if (invalidAttendees.length > 0) {
      setError("Por favor ingresa el nombre de todos los asistentes");
      setCurrentStep(2);
      return;
    }

    if (userBalance < total) {
      setError(`Saldo insuficiente en ${selectedCurrency}. Por favor recarga tu cuenta.`);
      setShowAddBalanceModal(true);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await api.purchaseTicket({
        eventId: pageData.id?.toString() || "1",
        eventTitle: pageData.title || "",
        eventDate: pageData.date || "",
        eventLocation: pageData.location || "",
        eventImage: pageData.image || "",
        price: ticketPrices[selectedTicketType],
        quantity: ticketQuantity,
        currency: selectedCurrency,
        buyerInfo: {
          name: buyerInfo.fullName,
          email: buyerInfo.email,
          phone: buyerInfo.phone,
        },
        attendees: attendees.map(a => ({ name: a.name })),
        specialRequests: specialRequests || undefined,
      });

      await refreshUser();

      navigate("confirmation", {
        tickets: result.tickets,
        total: total,
        currency: selectedCurrency,
        quantity: ticketQuantity,
        ...pageData,
      });
    } catch (err: any) {
      setError(err.message || "Error al procesar la compra");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBalance = async () => {
    const amount = parseFloat(balanceAmount);
    if (!amount || amount <= 0) {
      return;
    }

    setLoading(true);
    try {
      await api.addBalance(amount, selectedCurrency);
      await refreshUser();
      setShowAddBalanceModal(false);
      setBalanceAmount("");
      setError("");
    } catch (err: any) {
      setError(err.message || "Error al agregar saldo");
    } finally {
      setLoading(false);
    }
  };

  const insufficientBalance = userBalance < total;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("event-detail", pageData)}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">Finalizar Compra</h1>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Ticket Selection */}
            <div className="lg:col-span-2">
              {/* Event Summary */}
              <Card className="mb-6 overflow-hidden border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
                  <Ticket className="h-5 w-5 text-blue-600" />
                  Detalles del Evento
                </h2>

                <div className="flex gap-4">
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg">
                    <ImageWithFallback
                      src={pageData.image}
                      alt={pageData.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{pageData.title}</h3>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{pageData.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{pageData.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Ticket Type Selection */}
              <Card className="mb-6 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Tipo de Boleto</h2>
                <RadioGroup value={selectedTicketType} onValueChange={setSelectedTicketType}>
                  <div className="space-y-3">
                    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 p-4 transition-all hover:border-blue-300 dark:hover:border-blue-600 has-[:checked]:border-blue-600 dark:has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/30">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="general" id="general" />
                        <div>
                          <Label htmlFor="general" className="cursor-pointer font-medium text-gray-900 dark:text-white">
                            General
                          </Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Acceso estándar al evento</p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(ticketPrices.general, selectedCurrency)}</span>
                    </label>

                    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 p-4 transition-all hover:border-blue-300 dark:hover:border-blue-600 has-[:checked]:border-blue-600 dark:has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/30">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="vip" id="vip" />
                        <div>
                          <Label htmlFor="vip" className="cursor-pointer font-medium text-gray-900 dark:text-white">
                            VIP
                          </Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Asientos preferenciales</p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(ticketPrices.vip, selectedCurrency)}</span>
                    </label>

                    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 p-4 transition-all hover:border-blue-300 dark:hover:border-blue-600 has-[:checked]:border-blue-600 dark:has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/30">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="palco" id="palco" />
                        <div>
                          <Label htmlFor="palco" className="cursor-pointer font-medium text-gray-900 dark:text-white">
                            Palco Premium
                          </Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Experiencia exclusiva</p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(ticketPrices.palco, selectedCurrency)}</span>
                    </label>
                  </div>
                </RadioGroup>
              </Card>

              {/* Quantity Selection */}
              <Card className="mb-6 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Cantidad de Boletos</h2>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                    disabled={ticketQuantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center text-xl font-semibold">{ticketQuantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setTicketQuantity(Math.min(10, ticketQuantity + 1))}
                    disabled={ticketQuantity >= 10}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-500">Máximo 10 boletos por compra</span>
                </div>
              </Card>

              {/* Onboarding Steps */}
              <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                {/* Progress Steps */}
                <div className="mb-6 flex items-center justify-between">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                          currentStep === step
                            ? "border-blue-600 dark:border-blue-500 bg-blue-600 text-white"
                            : currentStep > step
                            ? "border-green-600 dark:border-green-500 bg-green-600 text-white"
                            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {currentStep > step ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <span className="font-semibold">{step}</span>
                        )}
                      </div>
                      {step < 3 && (
                        <div
                          className={`h-0.5 w-12 transition-all ${
                            currentStep > step ? "bg-green-600 dark:bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Step 1: Buyer Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="mb-2 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Información del Comprador
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Necesitamos esta información para procesar tu compra y enviarte los boletos
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">
                          Nombre Completo <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="fullName"
                          value={buyerInfo.fullName}
                          onChange={(e) =>
                            setBuyerInfo({ ...buyerInfo, fullName: e.target.value })
                          }
                          placeholder="Juan Pérez"
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">
                          Correo Electrónico <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            value={buyerInfo.email}
                            onChange={(e) =>
                              setBuyerInfo({ ...buyerInfo, email: e.target.value })
                            }
                            placeholder="tu@email.com"
                            className="h-11 pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          Teléfono <span className="text-gray-500">(opcional)</span>
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                            id="phone"
                            type="tel"
                            value={buyerInfo.phone}
                            onChange={(e) =>
                              setBuyerInfo({ ...buyerInfo, phone: e.target.value })
                            }
                            placeholder="+52 55 1234 5678"
                            className="h-11 pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Attendees Information */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="mb-2 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Información de los Asistentes
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Ingresa el nombre completo de cada persona que asistirá al evento
                      </p>
                    </div>

                    <div className="space-y-4">
                      {attendees.map((attendee, index) => (
                        <div key={index} className="space-y-2">
                          <Label htmlFor={`attendee-${index}`}>
                            Asistente {index + 1} <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id={`attendee-${index}`}
                            value={attendee.name}
                            onChange={(e) => {
                              const newAttendees = [...attendees];
                              newAttendees[index] = { ...newAttendees[index], name: e.target.value };
                              setAttendees(newAttendees);
                            }}
                            placeholder={`Nombre completo del asistente ${index + 1}`}
                            className="h-11"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Review and Additional Info */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="mb-2 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
                        <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Revisión y Solicitudes Especiales
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Revisa la información y agrega cualquier solicitud especial si es necesario
                      </p>
                    </div>

                    <div className="space-y-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
                      <div>
                        <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Información del Comprador</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Nombre:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{buyerInfo.fullName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Email:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{buyerInfo.email}</span>
                          </div>
                          {buyerInfo.phone && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Teléfono:</span>
                              <span className="font-medium text-gray-900 dark:text-white">{buyerInfo.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator className="dark:bg-gray-700" />

                      <div>
                        <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Asistentes ({attendees.length})</h3>
                        <div className="space-y-1 text-sm">
                          {attendees.map((attendee, index) => (
                            <div key={index} className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Asistente {index + 1}:</span>
                              <span className="font-medium text-gray-900 dark:text-white">{attendee.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialRequests">
                        Solicitudes Especiales <span className="text-gray-500">(opcional)</span>
                      </Label>
                      <Textarea
                        id="specialRequests"
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Accesibilidad, preferencias de asientos, necesidades especiales..."
                        className="min-h-[100px] resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-6 flex justify-between">
                  {currentStep > 1 && (
                    <Button variant="outline" onClick={handlePreviousStep}>
                      Anterior
                    </Button>
                  )}
                  <div className="ml-auto">
                    {currentStep < 3 ? (
                      <Button onClick={handleNextStep} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                        Siguiente
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setCurrentStep(1)}
                        variant="outline"
                      >
                        Editar Información
                      </Button>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                {/* Balance Card */}
                <Card className="mb-6 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 dark:from-blue-900/20 to-indigo-50 dark:to-indigo-900/20 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Tu Saldo en {selectedCurrency}</h3>
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-blue-600" />
                      <CurrencySelector
                        selectedCurrency={selectedCurrency}
                        onCurrencyChange={setSelectedCurrency}
                        showLabel={false}
                      />
                    </div>
                  </div>
                  <p className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(userBalance, selectedCurrency)}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("add-balance")}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Agregar Saldo
                  </Button>
                </Card>

                {/* Summary Card */}
                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                  <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Resumen de Compra</h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {ticketQuantity}x Boleto {selectedTicketType.charAt(0).toUpperCase() + selectedTicketType.slice(1)}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(subtotal, selectedCurrency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Cargo por servicio (10%)</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(serviceFee, selectedCurrency)}</span>
                    </div>
                  </div>

                  <Separator className="my-4 dark:bg-gray-700" />

                  <div className="mb-6 flex justify-between text-lg">
                    <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(total, selectedCurrency)}</span>
                  </div>

                  {insufficientBalance && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                        <div>
                          <p className="font-medium text-red-900">Saldo Insuficiente</p>
                          <p className="text-sm text-red-700">
                            Necesitas ${(total - user.balance).toLocaleString()} MXN más para completar esta compra
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && !insufficientBalance && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm hover:shadow-md"
                    onClick={handleCheckout}
                    disabled={loading || insufficientBalance || currentStep < 3}
                  >
                    {loading ? "Procesando..." : currentStep < 3 ? "Completa el formulario arriba" : `Pagar ${formatCurrency(total, selectedCurrency)}`}
                  </Button>

                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Lock className="h-3 w-3" />
                    <span>Pago seguro con tu saldo interno</span>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Balance Modal */}
      <Dialog open={showAddBalanceModal} onOpenChange={setShowAddBalanceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Saldo</DialogTitle>
            <DialogDescription>
              Agrega fondos a tu cuenta para comprar tickets
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
              <p className="text-sm text-blue-900 dark:text-blue-300">
                Saldo actual: <span className="font-bold dark:text-blue-200">${user.balance.toLocaleString()} MXN</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance-amount">Cantidad a Agregar</Label>
              <Input
                id="balance-amount"
                type="number"
                placeholder="1000"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                min="1"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={() => setBalanceAmount("500")}>
                $500
              </Button>
              <Button variant="outline" onClick={() => setBalanceAmount("1000")}>
                $1,000
              </Button>
              <Button variant="outline" onClick={() => setBalanceAmount("2000")}>
                $2,000
              </Button>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleAddBalance}
              disabled={loading || !balanceAmount || parseFloat(balanceAmount) <= 0}
            >
              {loading ? "Procesando..." : "Agregar Saldo"}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              En un entorno de producción, aquí se integraría un procesador de pagos real
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
