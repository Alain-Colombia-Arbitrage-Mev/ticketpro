import React, { useState, useEffect } from "react";
import { ChevronLeft, CreditCard, Lock, Ticket, Calendar, MapPin, User, Mail, Phone, CheckCircle2, Shield, Building2, Bitcoin, Wallet, Gift } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { ImageWithFallback } from "../components/media";
import { useRouter } from "../hooks/useRouter";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { SEOHead } from "../components/common";
import { createTicket, TicketData, getTicketCategories, getPaymentMethods } from "../utils/tickets/ticketService";
import { useCartStore } from "../stores/cartStore";

type PaymentMethod = "card" | "ach" | "crypto" | "free";

export function CheckoutPage() {
  const { navigate, pageData } = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { clearCart } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [createdTickets, setCreatedTickets] = useState<any[]>([]);
  const [ticketCategories, setTicketCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  
  // Verificar si hay items del carrito
  const cartItems = (pageData as any)?.cartItems || null;

  // Cargar categorías y métodos de pago al montar
  useEffect(() => {
    const loadData = async () => {
      const [categories, methods] = await Promise.all([
        getTicketCategories(),
        getPaymentMethods()
      ]);
      setTicketCategories(categories);
      setPaymentMethods(methods);
    };
    loadData();
  }, []);
  
  // Formulario
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: user?.address || "",
    // Tarjeta
    cardNumber: "",
    cardExpiry: "",
    cardCVV: "",
    // ACH
    routingNumber: "",
    accountNumber: "",
    accountType: "checking",
    // Crypto
    walletAddress: "",
    cryptoType: "bitcoin",
  });

  // Actualizar dirección cuando el usuario cambie
  useEffect(() => {
    if (user?.address) {
      setFormData(prev => ({ ...prev, address: user.address || "" }));
    }
  }, [user?.address]);

  if (!pageData) {
    navigate("home");
    return null;
  }

  const ticketPrice = parseInt(pageData.ticketPrice?.replace(/[^0-9]/g, "") || "800");
  const subtotal = ticketPrice * quantity;
  const serviceFee = Math.round(subtotal * 0.1);
  const total = subtotal + serviceFee;

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= 10) {
      setQuantity(newQty);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCardNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, "$1 ");
    handleInputChange("cardNumber", formatted);
  };

  const handleExpiryChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    let formatted = cleaned;
    if (cleaned.length >= 2) {
      formatted = cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    handleInputChange("cardExpiry", formatted);
  };

  const handleCVVChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);
    handleInputChange("cardCVV", cleaned);
  };

  const handleRoutingNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 9);
    handleInputChange("routingNumber", cleaned);
  };

  const handleAccountNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 17);
    handleInputChange("accountNumber", cleaned);
  };

  const validateForm = (): boolean => {
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address) {
      alert("Por favor completa todos los campos de contacto, incluyendo la dirección");
      return false;
    }

    // Método gratuito no requiere validación de pago
    if (paymentMethod === "free") {
      return true;
    }

    if (paymentMethod === "card") {
      if (!formData.cardNumber || !formData.cardExpiry || !formData.cardCVV) {
        alert("Por favor completa todos los datos de la tarjeta");
        return false;
      }
    } else if (paymentMethod === "ach") {
      if (!formData.routingNumber || !formData.accountNumber) {
        alert("Por favor completa todos los datos bancarios");
        return false;
      }
    } else if (paymentMethod === "crypto") {
      if (!formData.walletAddress) {
        alert("Por favor ingresa tu dirección de wallet");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Método gratuito: procesar inmediatamente sin simular pago
      if (paymentMethod !== "free") {
        // Simular procesamiento de pago para otros métodos
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Obtener IDs de categoría y método de pago
      const ticketCategory = ticketCategories.find(cat => 
        cat.name === (pageData.ticketClass?.toUpperCase() || 'GENERAL')
      ) || ticketCategories.find(cat => cat.name === 'GENERAL');
      
      // Para método gratuito, usar un método de pago especial o crear uno temporal
      const paymentMethodObj = paymentMethod === "free" 
        ? { id: null, name: 'free' } // Método gratuito no requiere ID real
        : paymentMethods.find(method => method.name === paymentMethod)
          || paymentMethods.find(method => method.name === 'balance');

      // Crear boletas para cada ticket comprado
      const tickets: any[] = [];
      const purchaseId = crypto.randomUUID();
      
      // Si hay items del carrito, procesar todos los items
      if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
        // Procesar todos los items del carrito
        for (const cartItem of cartItems) {
          const itemTicketCategory = ticketCategories.find(cat => 
            cat.name === (cartItem.ticketType?.toUpperCase() || 'GENERAL')
          ) || ticketCategories.find(cat => cat.name === 'GENERAL');
          
          // Crear tickets para cada cantidad del item
          for (let i = 0; i < cartItem.quantity; i++) {
            const ticketData: TicketData = {
              eventId: cartItem.eventId,
              eventName: cartItem.eventName,
              eventDate: cartItem.eventDate || new Date().toISOString().split('T')[0],
              eventTime: cartItem.eventTime,
              eventLocation: cartItem.eventLocation,
              eventCategory: cartItem.eventCategory,
              buyerId: user?.id,
              buyerEmail: formData.email,
              buyerFullName: formData.fullName,
              buyerAddress: formData.address,
              ticketType: cartItem.ticketType || 'General',
              seatNumber: cartItem.seatNumber || undefined,
              seatType: cartItem.seatType || 'numerado',
              gateNumber: undefined,
              ticketClass: cartItem.ticketType || 'General',
              ticketCategoryId: itemTicketCategory?.id,
              price: cartItem.ticketPrice,
              pricePaid: cartItem.total / cartItem.quantity, // Precio por ticket
              paymentMethodId: paymentMethodObj?.id,
              purchaseId: purchaseId,
              purchaseSummary: {
                subtotal: cartItem.subtotal,
                serviceFee: cartItem.serviceFee,
                total: cartItem.total,
                quantity: cartItem.quantity,
                paymentMethod: paymentMethod,
                purchaseDate: new Date().toISOString()
              },
            };
            
            const ticket = await createTicket(ticketData);
            tickets.push(ticket);
          }
        }
      } else {
        // Procesar un solo item (compatibilidad con checkout directo)
        for (let i = 0; i < quantity; i++) {
          const ticketData: TicketData = {
            eventId: pageData.id || 1,
            eventName: pageData.title || 'Evento',
            eventDate: pageData.date || new Date().toISOString().split('T')[0],
            eventTime: pageData.time,
            eventLocation: pageData.location,
            eventCategory: pageData.category || pageData.eventCategory || undefined,
            buyerId: user?.id,
            buyerEmail: formData.email,
            buyerFullName: formData.fullName,
            buyerAddress: '', // Se puede agregar campo de dirección si es necesario
            ticketType: pageData.ticketType || 'General',
            seatNumber: pageData.seatNumber || undefined,
            seatType: pageData.seatType || 'numerado', // numerado, general, preferencial
            gateNumber: pageData.gateNumber || undefined,
            ticketClass: pageData.ticketClass || 'VIP',
            ticketCategoryId: ticketCategory?.id,
            price: ticketPrice,
            pricePaid: total, // Precio total pagado (incluye fees)
            paymentMethodId: paymentMethodObj?.id,
            purchaseId: purchaseId,
            purchaseSummary: {
              subtotal: subtotal,
              serviceFee: serviceFee,
              total: total,
              quantity: quantity,
              paymentMethod: paymentMethod,
              purchaseDate: new Date().toISOString()
            },
          };
          
          const ticket = await createTicket(ticketData);
          tickets.push(ticket);
        }
      }
      
      // Limpiar el carrito después de una compra exitosa
      // Esto asegura que el carrito se restaure completamente después de cualquier compra
      clearCart();
      
      // Enviar PIN por email a cada ticket creado
      const { sendTicketPinEmail } = await import('../utils/tickets/ticketService');
      for (const ticket of tickets) {
        if (ticket.pin && formData.email) {
          try {
            await sendTicketPinEmail(
              ticket.id,
              ticket.ticket_code,
              ticket.pin,
              formData.email,
              formData.fullName,
              ticket.event_name,
              ticket.event_date
            );
            console.log(`PIN enviado por email para ticket ${ticket.ticket_code}`);
          } catch (emailError) {
            console.warn(`No se pudo enviar el PIN por email para ticket ${ticket.ticket_code}:`, emailError);
            // No bloquear el flujo si falla el envío de email
          }
        }
      }
      
      setCreatedTickets(tickets);
      setLoading(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating tickets:', error);
      alert('Error al crear las boletas. Por favor, contacta al soporte.');
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    // Navegar a confirmación con los tickets creados
    navigate("confirmation", {
      tickets: createdTickets,
      event: pageData,
      quantity: quantity,
      total: total
    });
  };

  const paymentMethodOptions = [
    {
      id: "free" as PaymentMethod,
      name: "Gratis (Prueba)",
      icon: <Gift className="h-5 w-5" />,
      description: "Método de prueba sin costo",
    },
    {
      id: "card" as PaymentMethod,
      name: "Tarjeta de Crédito/Débito",
      icon: <CreditCard className="h-5 w-5" />,
      description: "Visa, Mastercard, American Express",
    },
    {
      id: "ach" as PaymentMethod,
      name: "Transferencia ACH",
      icon: <Building2 className="h-5 w-5" />,
      description: "Transferencia bancaria en EE.UU.",
    },
    {
      id: "crypto" as PaymentMethod,
      name: "Criptomonedas",
      icon: <Bitcoin className="h-5 w-5" />,
      description: "Bitcoin, Ethereum, USDT",
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEOHead
        seo={{
          title: `Checkout - ${pageData.title}`,
          description: `Completa tu compra para ${pageData.title}`,
        }}
      />

      {/* Header */}
      <div className="border-b border-white/20 bg-black sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => navigate("event-detail", pageData)}
            className="gap-2 !text-white hover:!bg-white/10"
          >
            <ChevronLeft className="h-4 w-4 !text-white" />
            Volver
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-8 text-3xl font-bold !text-white">Checkout</h1>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Formulario de Pago */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información de Contacto */}
                <Card className="p-6 !bg-white/5 border-white/20">
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-bold !text-white">
                    <User className="h-5 w-5" />
                    Información de Contacto
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName" className="!text-white/80">Nombre Completo *</Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        className="mt-1 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40"
                        placeholder="Juan Pérez"
                        required
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="email" className="!text-white/80">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          className="mt-1 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40"
                          placeholder="juan@example.com"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone" className="!text-white/80">Teléfono *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          className="mt-1 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40"
                          placeholder="+1 (555) 123-4567"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address" className="!text-white/80 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Dirección *
                      </Label>
                      <Input
                        id="address"
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        className="mt-1 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40"
                        placeholder="Calle, número, ciudad, estado, código postal"
                        required
                      />
                      {user?.address && (
                        <p className="mt-1 text-xs !text-white/60">
                          Usando tu dirección guardada. Puedes editarla si es necesario.
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Método de Pago */}
                <Card className="p-6 !bg-white/5 border-white/20">
                  <h2 className="mb-6 flex items-center gap-2 text-xl font-bold !text-white">
                    <Wallet className="h-5 w-5" />
                    Selecciona tu Método de Pago
                  </h2>
                  
                  <div className="grid gap-4 sm:grid-cols-3">
                    {paymentMethodOptions.map((method) => (
                      <div
                        key={method.id}
                        className={`relative flex flex-col items-center justify-center rounded-xl border-2 p-6 cursor-pointer transition-all hover:scale-105 ${
                          paymentMethod === method.id
                            ? "border-[#c61619] !bg-[#c61619]/20 shadow-lg shadow-[#c61619]/20"
                            : "border-white/20 !bg-white/5 hover:border-white/40 hover:!bg-white/10"
                        }`}
                        onClick={() => {
                          console.log("Cambiando método de pago a:", method.id);
                          setPaymentMethod(method.id);
                        }}
                      >
                          {paymentMethod === method.id && (
                            <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#c61619]">
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            </div>
                          )}
                          
                          <div className={`mb-3 flex h-16 w-16 items-center justify-center rounded-full transition-all ${
                            paymentMethod === method.id
                              ? "bg-[#c61619] text-white"
                              : "bg-white/10 text-white/70"
                          }`}>
                            <div className="scale-150">
                              {method.icon}
                            </div>
                          </div>
                          
                          <Label
                            htmlFor={method.id}
                            className="text-center !text-white font-bold cursor-pointer mb-2"
                          >
                            {method.name}
                          </Label>
                          
                          <p className="text-xs text-center !text-white/60">{method.description}</p>
                        </div>
                      ))}
                    </div>
                </Card>

                {/* Formulario según método de pago */}
                <Card className="p-6 !bg-white/5 border-white/20">
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-bold !text-white">
                    <Lock className="h-5 w-5" />
                    Información de Pago
                  </h2>

                  {/* Tarjeta de Crédito/Débito */}
                  {paymentMethod === "card" && (
                    <div key="card-form" className="space-y-4 animate-fade-in-up">
                      {/* Logos de tarjetas aceptadas */}
                      <div className="flex items-center justify-center gap-4 p-4 rounded-lg !bg-white/5 border border-white/10">
                        <div className="text-xs !text-white/60">Aceptamos:</div>
                        <div className="flex gap-3">
                          <div className="h-8 px-3 flex items-center justify-center rounded bg-white/10 border border-white/20">
                            <span className="text-xs font-bold !text-white">VISA</span>
                          </div>
                          <div className="h-8 px-3 flex items-center justify-center rounded bg-white/10 border border-white/20">
                            <span className="text-xs font-bold !text-white">MC</span>
                          </div>
                          <div className="h-8 px-3 flex items-center justify-center rounded bg-white/10 border border-white/20">
                            <span className="text-xs font-bold !text-white">AMEX</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="cardNumber" className="!text-white/80 mb-2 block">Número de Tarjeta *</Label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 !text-white/40" />
                          <Input
                            id="cardNumber"
                            type="text"
                            value={formData.cardNumber}
                            onChange={(e) => handleCardNumberChange(e.target.value)}
                            className="pl-11 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40 h-12"
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="cardExpiry" className="!text-white/80 mb-2 block">Vencimiento *</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 !text-white/40" />
                            <Input
                              id="cardExpiry"
                              type="text"
                              value={formData.cardExpiry}
                              onChange={(e) => handleExpiryChange(e.target.value)}
                              className="pl-11 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40 h-12"
                              placeholder="MM/YY"
                              maxLength={5}
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="cardCVV" className="!text-white/80 mb-2 block">CVV *</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 !text-white/40 z-10" />
                            <Input
                              id="cardCVV"
                              type="password"
                              inputMode="numeric"
                              autoComplete="new-password"
                              value={formData.cardCVV}
                              onChange={(e) => handleCVVChange(e.target.value)}
                              onCopy={(e) => e.preventDefault()}
                              onPaste={(e) => e.preventDefault()}
                              onCut={(e) => e.preventDefault()}
                              onContextMenu={(e) => e.preventDefault()}
                              className="pl-10 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40 h-12 font-mono tracking-widest"
                              placeholder="•••"
                              maxLength={4}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ACH Transfer */}
                  {paymentMethod === "ach" && (
                    <div key="ach-form" className="space-y-4 animate-fade-in-up">
                      {/* Info banner */}
                      <div className="flex items-start gap-3 rounded-lg !bg-blue-500/10 p-4 border border-blue-500/20">
                        <Building2 className="h-5 w-5 !text-blue-300 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm !text-blue-300 font-semibold mb-1">Transferencia Bancaria en EE.UU.</p>
                          <p className="text-xs !text-blue-200/80">
                            Las transferencias ACH tardan 1-3 días hábiles. Recibirás tus tickets por email una vez confirmado el pago.
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="routingNumber" className="!text-white/80 mb-2 block">Routing Number (9 dígitos) *</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 !text-white/40" />
                          <Input
                            id="routingNumber"
                            type="text"
                            value={formData.routingNumber}
                            onChange={(e) => handleRoutingNumberChange(e.target.value)}
                            className="pl-11 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40 h-12 font-mono"
                            placeholder="123456789"
                            maxLength={9}
                            required
                          />
                        </div>
                        <p className="text-xs !text-white/50 mt-1">Número de ruta de 9 dígitos de tu banco</p>
                      </div>

                      <div>
                        <Label htmlFor="accountNumber" className="!text-white/80 mb-2 block">Account Number *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 !text-white/40" />
                          <Input
                            id="accountNumber"
                            type="text"
                            value={formData.accountNumber}
                            onChange={(e) => handleAccountNumberChange(e.target.value)}
                            className="pl-11 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40 h-12 font-mono"
                            placeholder="12345678901234"
                            maxLength={17}
                            required
                          />
                        </div>
                        <p className="text-xs !text-white/50 mt-1">Número de cuenta bancaria (hasta 17 dígitos)</p>
                      </div>

                      <div>
                        <Label className="!text-white/80 mb-3 block">Tipo de Cuenta *</Label>
                        <RadioGroup value={formData.accountType} onValueChange={(value) => handleInputChange("accountType", value)}>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div 
                              className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                                formData.accountType === "checking"
                                  ? "border-[#c61619] !bg-[#c61619]/10"
                                  : "border-white/20 !bg-white/5 hover:border-white/40"
                              }`}
                              onClick={() => handleInputChange("accountType", "checking")}
                            >
                              <RadioGroupItem value="checking" id="checking" />
                              <Label htmlFor="checking" className="!text-white cursor-pointer font-medium flex-1">
                                Checking Account
                              </Label>
                            </div>
                            <div 
                              className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                                formData.accountType === "savings"
                                  ? "border-[#c61619] !bg-[#c61619]/10"
                                  : "border-white/20 !bg-white/5 hover:border-white/40"
                              }`}
                              onClick={() => handleInputChange("accountType", "savings")}
                            >
                              <RadioGroupItem value="savings" id="savings" />
                              <Label htmlFor="savings" className="!text-white cursor-pointer font-medium flex-1">
                                Savings Account
                              </Label>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  )}

                  {/* Método Gratuito */}
                  {paymentMethod === "free" && (
                    <div key="free-form" className="space-y-4 animate-fade-in-up">
                      <div className="rounded-lg !bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-6 border border-green-500/30 backdrop-blur">
                        <div className="flex items-start gap-3 mb-4">
                          <Gift className="h-6 w-6 !text-green-300 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-lg !text-green-300 font-bold mb-2">
                              Método de Pago Gratuito (Prueba)
                            </p>
                            <p className="text-sm !text-green-200/80 mb-3">
                              Este método está disponible solo para pruebas. No se realizará ningún cargo y los tickets se generarán inmediatamente.
                            </p>
                            <div className="flex items-center gap-2 text-xs !text-green-200/70 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Ideal para probar la generación de boletas y el sistema de tickets</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Crypto */}
                  {paymentMethod === "crypto" && (
                    <div key="crypto-form" className="space-y-4 animate-fade-in-up">
                      <div>
                        <Label className="!text-white/80 mb-3 block">Selecciona tu Criptomoneda *</Label>
                        <RadioGroup value={formData.cryptoType} onValueChange={(value) => handleInputChange("cryptoType", value)}>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div 
                              className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all hover:scale-105 ${
                                formData.cryptoType === "bitcoin"
                                  ? "border-[#c61619] !bg-[#c61619]/10"
                                  : "border-white/20 !bg-white/5 hover:border-white/40"
                              }`}
                              onClick={() => handleInputChange("cryptoType", "bitcoin")}
                            >
                              <RadioGroupItem value="bitcoin" id="bitcoin" className="sr-only" />
                              <Bitcoin className="h-10 w-10 !text-orange-400 mb-2" />
                              <Label htmlFor="bitcoin" className="!text-white cursor-pointer font-bold">Bitcoin</Label>
                              <span className="text-xs !text-white/60">BTC</span>
                            </div>
                            <div 
                              className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all hover:scale-105 ${
                                formData.cryptoType === "ethereum"
                                  ? "border-[#c61619] !bg-[#c61619]/10"
                                  : "border-white/20 !bg-white/5 hover:border-white/40"
                              }`}
                              onClick={() => handleInputChange("cryptoType", "ethereum")}
                            >
                              <RadioGroupItem value="ethereum" id="ethereum" className="sr-only" />
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center mb-2">
                                <span className="text-white font-bold text-xs">ETH</span>
                              </div>
                              <Label htmlFor="ethereum" className="!text-white cursor-pointer font-bold">Ethereum</Label>
                              <span className="text-xs !text-white/60">ETH</span>
                            </div>
                            <div 
                              className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all hover:scale-105 ${
                                formData.cryptoType === "usdt"
                                  ? "border-[#c61619] !bg-[#c61619]/10"
                                  : "border-white/20 !bg-white/5 hover:border-white/40"
                              }`}
                              onClick={() => handleInputChange("cryptoType", "usdt")}
                            >
                              <RadioGroupItem value="usdt" id="usdt" className="sr-only" />
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center mb-2">
                                <span className="text-white font-bold text-xs">₮</span>
                              </div>
                              <Label htmlFor="usdt" className="!text-white cursor-pointer font-bold">Tether</Label>
                              <span className="text-xs !text-white/60">USDT</span>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>

                      <div>
                        <Label htmlFor="walletAddress" className="!text-white/80 mb-2 block">Tu Dirección de Wallet *</Label>
                        <div className="relative">
                          <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 !text-white/40" />
                          <Input
                            id="walletAddress"
                            type="text"
                            value={formData.walletAddress}
                            onChange={(e) => handleInputChange("walletAddress", e.target.value)}
                            className="pl-11 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40 h-12 font-mono text-sm"
                            placeholder="0x1234...5678 o bc1q..."
                            required
                          />
                        </div>
                        <p className="text-xs !text-white/50 mt-1">Esta será la dirección desde la cual realizarás el pago</p>
                      </div>

                      <div className="rounded-lg !bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-5 border border-purple-500/30 backdrop-blur">
                        <div className="flex items-start gap-3 mb-3">
                          <Bitcoin className="h-5 w-5 !text-purple-300 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm !text-purple-300 font-semibold mb-1">
                              Dirección para enviar el pago
                            </p>
                            <p className="text-xs !text-purple-200/70">
                              Envía exactamente ${total} USD equivalente en {formData.cryptoType.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="!bg-black/50 p-4 rounded-lg border border-purple-500/30 relative">
                          <code className="text-sm !text-white break-all font-mono block">
                            {formData.cryptoType === "bitcoin" && "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"}
                            {formData.cryptoType === "ethereum" && "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}
                            {formData.cryptoType === "usdt" && "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}
                          </code>
                          <Button
                            type="button"
                            size="sm"
                            className="absolute top-2 right-2 h-8 !bg-purple-500/20 hover:!bg-purple-500/30 !text-purple-200 border border-purple-500/30"
                            onClick={() => {
                              const address = formData.cryptoType === "bitcoin" 
                                ? "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                                : "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
                              navigator.clipboard.writeText(address);
                            }}
                          >
                            Copiar
                          </Button>
                        </div>
                        
                        <div className="mt-3 flex items-center gap-2 text-xs !text-purple-200/80">
                          <Shield className="h-4 w-4" />
                          <span>Los tickets se enviarán tras confirmar la transacción blockchain</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 rounded-lg !bg-white/5 p-3 border border-white/10 mt-4">
                    <Shield className="h-4 w-4 !text-green-400" />
                    <p className="text-sm !text-white/70">
                      Tu información está protegida con encriptación SSL de 256 bits
                    </p>
                  </div>
                </Card>

                {/* Botón de Pago */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-14 w-full !bg-[#c61619] hover:!bg-[#a01316] text-lg font-semibold shadow-lg !text-white"
                >
                  {loading ? (
                    <>Procesando...</>
                  ) : (
                    <>
                      {paymentMethod === "free" ? (
                        <>
                          <Gift className="mr-2 h-5 w-5" />
                          Obtener Tickets Gratis (Prueba)
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-5 w-5" />
                          {paymentMethod === "ach" ? "Autorizar Transferencia" : "Pagar"} ${total.toLocaleString()} MXN
                        </>
                      )}
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Resumen del Pedido */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="overflow-hidden !bg-white/5 border-white/20">
                  <div className="border-b border-white/20 bg-[#c61619] p-4">
                    <h3 className="font-bold text-white">Resumen del Pedido</h3>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {/* Imagen del Evento */}
                    <div className="aspect-video w-full overflow-hidden rounded-lg">
                      <ImageWithFallback
                        src={pageData.image}
                        alt={pageData.title}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Detalles del Evento */}
                    <div>
                      <h4 className="font-bold !text-white mb-3 text-lg">{pageData.title}</h4>
                      <div className="space-y-2.5 text-sm">
                        <div className="flex items-center gap-2 !text-white/90">
                          <Calendar className="h-4 w-4 !text-white/70" />
                          <span>{pageData.date}</span>
                        </div>
                        <div className="flex items-center gap-2 !text-white/90">
                          <MapPin className="h-4 w-4 !text-white/70" />
                          <span>{pageData.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Ticket className="h-4 w-4 !text-white/70" />
                          <span className="capitalize !text-white/90 font-medium">{pageData.selectedTicketType || "General"}</span>
                        </div>
                      </div>
                    </div>

                    <Separator className="!bg-white/20" />

                    {/* Cantidad - Mejorado */}
                    <div>
                      <Label className="!text-white mb-3 block font-semibold text-base">Cantidad de Entradas</Label>
                      
                      {/* Selector principal con botones +/- */}
                      <div className="flex items-center gap-3 mb-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                          className="h-12 w-12 !bg-white/10 border-white/30 !text-white hover:!bg-white/20 hover:border-white/40 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all"
                        >
                          <span className="text-xl font-bold">−</span>
                        </Button>
                        <div className="flex-1 text-center">
                          <div className="text-3xl font-bold !text-white mb-1">{quantity}</div>
                          <div className="text-xs !text-white/60">
                            {quantity === 1 ? 'entrada' : 'entradas'}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(1)}
                          disabled={quantity >= 10}
                          className="h-12 w-12 !bg-white/10 border-white/30 !text-white hover:!bg-white/20 hover:border-white/40 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all"
                        >
                          <span className="text-xl font-bold">+</span>
                        </Button>
                      </div>

                      {/* Opciones rápidas de cantidad */}
                      <div className="mb-4">
                        <Label className="!text-white/70 mb-2 block text-xs">O selecciona rápidamente:</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {[2, 4, 6, 8].map((quickQty) => (
                            <button
                              key={quickQty}
                              type="button"
                              onClick={() => setQuantity(quickQty)}
                              className={`px-3 py-2 rounded-lg border-2 transition-all text-sm font-semibold ${
                                quantity === quickQty
                                  ? "border-[#c61619] bg-[#c61619]/30 !text-white shadow-md"
                                  : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10 !text-white"
                              }`}
                            >
                              {quickQty}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Precio por entrada */}
                      <div className="rounded-lg border border-white/20 bg-white/5 p-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="!text-white/80">Precio por entrada</span>
                          <span className="font-semibold !text-white">${ticketPrice.toLocaleString()} MXN</span>
                        </div>
                      </div>
                    </div>

                    <Separator className="!bg-white/20" />

                    {/* Desglose de Precios - Mejorado */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="!text-white font-medium">Subtotal</div>
                          <div className="text-xs !text-white/60">
                            {quantity} {quantity === 1 ? 'entrada' : 'entradas'} × ${ticketPrice.toLocaleString()}
                          </div>
                        </div>
                        <span className="font-semibold !text-white">${subtotal.toLocaleString()} MXN</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="!text-white/80 font-medium text-sm">Cargo por servicio</div>
                          <div className="text-xs !text-white/50">10% del subtotal</div>
                        </div>
                        <span className="font-semibold !text-white/80">${serviceFee.toLocaleString()} MXN</span>
                      </div>
                      <Separator className="!bg-white/30" />
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-bold !text-white">
                          {paymentMethod === "free" ? "Total" : "Total a pagar"}
                        </span>
                        <span className={`text-2xl font-bold ${
                          paymentMethod === "free" ? "!text-green-400" : "!text-[#c61619]"
                        }`}>
                          {paymentMethod === "free" ? "GRATIS" : `$${total.toLocaleString()} MXN`}
                        </span>
                      </div>
                      {paymentMethod === "free" && (
                        <div className="mt-2 rounded-lg bg-green-500/10 border border-green-500/30 p-2">
                          <p className="text-xs !text-green-300 text-center">
                            🎁 Método de prueba - Sin cargo
                          </p>
                        </div>
                      )}
                      {quantity > 1 && (
                        <div className="mt-2 rounded-lg bg-[#c61619]/10 border border-[#c61619]/30 p-2">
                          <p className="text-xs !text-white/90 text-center">
                            🎟️ Comprando {quantity} entradas juntas
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Éxito */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="!bg-black border-white/20">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle2 className="h-10 w-10 text-green-400" />
            </div>
            <DialogTitle className="text-center text-2xl !text-white">
              ¡Compra Exitosa!
            </DialogTitle>
            <DialogDescription className="text-center !text-white/70">
              {paymentMethod === "free"
                ? "¡Tickets generados exitosamente! Este fue un método de prueba gratuito. Los tickets han sido creados y están disponibles en tu cuenta."
                : paymentMethod === "ach" 
                ? "Tu transferencia ha sido autorizada. Recibirás una confirmación por email en 1-3 días hábiles."
                : paymentMethod === "crypto"
                ? "Tu pago en criptomonedas ha sido recibido. Los tickets se enviarán a tu email una vez confirmada la transacción."
                : "Tu compra ha sido procesada correctamente. Los tickets han sido enviados a tu email."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Card className="p-4 !bg-white/5 border-white/20">
              <p className="text-sm !text-white/70 mb-2">Detalles de la compra:</p>
              <div className="space-y-1 text-sm">
                <p className="!text-white"><strong>Evento:</strong> {pageData.title}</p>
                <p className="!text-white"><strong>Cantidad:</strong> {quantity} {quantity === 1 ? 'ticket' : 'tickets'}</p>
                <p className="!text-white"><strong>Método de pago:</strong> {
                  paymentMethod === "free" ? "Gratis (Prueba)" :
                  paymentMethod === "card" ? "Tarjeta" :
                  paymentMethod === "ach" ? "ACH Transfer" :
                  "Criptomonedas"
                }</p>
                <p className="!text-white"><strong>Total:</strong> {
                  paymentMethod === "free" ? "GRATIS" : `$${total.toLocaleString()} MXN`
                }</p>
              </div>
            </Card>
          </div>

          <Button
            onClick={handleCloseSuccess}
            className="w-full !bg-[#c61619] hover:!bg-[#a01316] !text-white"
          >
            Volver al Inicio
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
