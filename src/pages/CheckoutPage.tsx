import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  CreditCard,
  Lock,
  Ticket,
  Calendar,
  MapPin,
  User,
  Mail,
  Phone,
  CheckCircle2,
  Shield,
  Building2,
  Bitcoin,
  Wallet,
  Gift,
  Info,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { ImageWithFallback } from "../components/media";
import { useRouter } from "../hooks/useRouter";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { SEOHead } from "../components/common";
import {
  createTicket,
  TicketData,
  getTicketCategories,
  getPaymentMethods,
} from "../utils/tickets/ticketService";
import { useCartStore } from "../stores/cartStore";
import { useCheckoutStore } from "../stores/checkoutStore";
import { CryptoPaymentModal } from "../components/payment";
import { AddressForm } from "../components/checkout";
import { toast } from "sonner";
import { stripeService } from "../services/stripe";

type PaymentMethod = "card" | "ach" | "crypto" | "free";

export function CheckoutPage() {
  const { navigate, pageData } = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { items: storeCartItems, clearCart, getTotalItems, getDiscount, getTotalWithDiscount } = useCartStore();
  const { checkoutInfo } = useCheckoutStore();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [createdTickets, setCreatedTickets] = useState<any[]>([]);
  const [ticketCategories, setTicketCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [cryptoOrderId, setCryptoOrderId] = useState<string>("");
  const [isAddressValid, setIsAddressValid] = useState(false);

  // Debug: Verificar pageData completo
  console.log('📦 CheckoutPage - pageData received:', {
    pageData,
    type: typeof pageData,
    keys: pageData ? Object.keys(pageData) : []
  });
  
  // IMPORTANTE: Usar items del STORE directamente para tener datos actualizados en tiempo real
  // Si el usuario edita cantidades en el carrito, se reflejarán aquí automáticamente
  const isCartCheckout = storeCartItems && storeCartItems.length > 0;
  const cartItems = isCartCheckout ? storeCartItems : null;
  
  // Debug: Verificar cartItems del store
  console.log('🛒 CheckoutPage - Using STORE cartItems:', {
    cartItems,
    isArray: Array.isArray(cartItems),
    length: cartItems?.length,
    isCartCheckout,
    storeItemsLength: storeCartItems.length
  });

  // Cargar categorías y métodos de pago al montar
  useEffect(() => {
    const loadData = async () => {
      const [categories, methods] = await Promise.all([
        getTicketCategories(),
        getPaymentMethods(),
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

  // Inicializar información de contacto con datos del usuario autenticado
  useEffect(() => {
    if (user) {
      const { setCheckoutInfo } = useCheckoutStore.getState();
      
      // Solo actualizar si los campos están vacíos
      if (!checkoutInfo.fullName && user.name) {
        setCheckoutInfo({ fullName: user.name });
      }
      if (!checkoutInfo.email && user.email) {
        setCheckoutInfo({ email: user.email });
      }
      if (!checkoutInfo.address && user.address) {
        setCheckoutInfo({ address: user.address });
      }
    }
  }, [user]);

  // Actualizar dirección cuando el usuario cambie
  useEffect(() => {
    if (user?.address) {
      setFormData((prev) => ({ ...prev, address: user.address || "" }));
    }
  }, [user?.address]);

  // Validar dirección inicial cuando checkoutInfo cambie
  useEffect(() => {
    const isValid = !!checkoutInfo.address && checkoutInfo.address.trim().length > 5;
    setIsAddressValid(isValid);
    console.log('✅ Validación de dirección:', { 
      hasAddress: !!checkoutInfo.address, 
      length: checkoutInfo.address?.length || 0, 
      isValid 
    });
  }, [checkoutInfo.address]);

  if (!pageData) {
    navigate("home");
    return null;
  }

  // Calcular totales según si es carrito o compra directa
  // Definir ticketPrice fuera para que sea accesible en todo el componente
  const ticketPrice = parseInt(pageData.ticketPrice?.replace(/[^0-9]/g, "") || "800");
  
  let subtotal: number;
  let serviceFee: number;
  let totalBeforeDiscount: number;
  let totalItems: number;
  let discountAmount: number;
  let total: number;

  if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
    // Usar cálculos del carrito
    subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    serviceFee = cartItems.reduce((sum, item) => sum + item.serviceFee, 0);
    totalBeforeDiscount = cartItems.reduce((sum, item) => sum + item.total, 0);
    totalItems = getTotalItems();
    discountAmount = getDiscount();
    total = getTotalWithDiscount();
    
    // Debug: Verificar descuento en checkout
    console.log('💳 CheckoutPage - Cart Discount:', {
      totalItems,
      subtotal,
      serviceFee,
      totalBeforeDiscount,
      discountAmount,
      total,
      shouldHaveDiscount: totalItems >= 2
    });
  } else {
    // Compra directa (un solo item)
    subtotal = ticketPrice * quantity;
    serviceFee = Math.round(subtotal * 0.1);
    totalBeforeDiscount = subtotal + serviceFee;
    totalItems = quantity;
    discountAmount = totalItems >= 2 ? Math.round(subtotal * 0.1) : 0; // Descuento sobre subtotal, no sobre totalBeforeDiscount
    total = totalBeforeDiscount - discountAmount;
  }

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= 10) {
      setQuantity(newQty);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    // Validar información de contacto
    if (
      !checkoutInfo.fullName ||
      !checkoutInfo.email ||
      !checkoutInfo.phone
    ) {
      toast.error("Por favor completa tu información de contacto");
      return false;
    }

    // ✅ Dirección solo es necesaria para pagos con tarjeta (Stripe)
    // Los boletos son digitales y se envían por correo
    if (paymentMethod === "card") {
    if (!isAddressValid || !checkoutInfo.address) {
        toast.error("Por favor completa tu dirección para pagos con tarjeta");
      return false;
      }
    }

    // ✅ Crypto (Cryptomus): NO requiere dirección ni wallet
    // Cryptomus maneja la selección de moneda y wallet en su propia interfaz
    if (paymentMethod === "crypto") {
      return true;
    }

    // ✅ Método gratuito: solo requiere información de contacto
    if (paymentMethod === "free") {
      return true;
    }

    // ✅ Método ACH: no requiere dirección (boletos digitales por correo)
    if (paymentMethod === "ach") {
      return true;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Si es pago con tarjeta, usar Stripe
    if (paymentMethod === "card") {
      setLoading(true);
      try {
        // Verificar que Stripe esté configurado
        if (!stripeService.isConfigured()) {
          toast.error("Stripe no está configurado correctamente");
          setLoading(false);
          return;
        }

        // Preparar items para Stripe
        const items =
          cartItems && Array.isArray(cartItems) && cartItems.length > 0
            ? cartItems.map((ci) => ({
                eventId: ci.eventId,
                eventName: ci.eventName,
                eventDate: ci.eventDate || new Date().toISOString().split("T")[0],
                eventTime: ci.eventTime,
                eventLocation: ci.eventLocation,
                eventCategory: ci.eventCategory,
                ticketType: ci.ticketType || "General",
                seatType: ci.seatType || "general",
                price: ci.ticketPrice,
                quantity: ci.quantity,
                buyerEmail: checkoutInfo.email || '',
                buyerFullName: checkoutInfo.fullName || '',
                buyerAddress: [
                  checkoutInfo.address,
                  checkoutInfo.city,
                  checkoutInfo.state,
                  checkoutInfo.zipCode,
                  checkoutInfo.country
                ].filter(Boolean).join(', '),
              }))
            : [
                {
                  eventId: pageData.id || 1,
                  eventName: pageData.title || "Evento",
                  eventDate: pageData.date || new Date().toISOString().split("T")[0],
                  eventTime: pageData.time,
                  eventLocation: pageData.location,
                  eventCategory: pageData.category || pageData.eventCategory || undefined,
                  ticketType: pageData.ticketType || "General",
                  seatType: pageData.seatType || "general",
                  price: total,
                  quantity: quantity,
                  buyerEmail: checkoutInfo.email || '',
                  buyerFullName: checkoutInfo.fullName || '',
                  buyerAddress: [
                    checkoutInfo.address,
                    checkoutInfo.city,
                    checkoutInfo.state,
                    checkoutInfo.zipCode,
                    checkoutInfo.country
                  ].filter(Boolean).join(', '),
                },
              ];

        console.log('💳 Iniciando pago con Stripe:', { items, total });

        // Crear sesión de checkout de Stripe
        const frontendUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
        const session = await stripeService.createCheckoutSession({
          items,
          buyerEmail: checkoutInfo.email || '',
          buyerFullName: checkoutInfo.fullName || '',
          buyerAddress: [
            checkoutInfo.address,
            checkoutInfo.city,
            checkoutInfo.state,
            checkoutInfo.zipCode,
            checkoutInfo.country
          ].filter(Boolean).join(', '),
          successUrl: `${frontendUrl}/#/confirmation?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${frontendUrl}/#/checkout?canceled=true`,
        });

        if (session.url) {
          console.log('✅ Redirigiendo a Stripe Checkout');
          // Redirigir a Stripe Checkout
          window.location.href = session.url;
        } else {
          throw new Error('No se recibió URL de Stripe');
        }
      } catch (error: any) {
        console.error('❌ Error al procesar pago con Stripe:', error);
        toast.error(error.message || 'Error al procesar el pago con Stripe');
        setLoading(false);
      }
      return;
    }

    // Si es pago con cripto, abrir el modal de Cryptomus
    if (paymentMethod === "crypto") {
      const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const items =
        cartItems && Array.isArray(cartItems) && cartItems.length > 0
          ? cartItems.map((ci) => ({
              eventId: ci.eventId,
              eventName: ci.eventName,
              eventDate: ci.eventDate || new Date().toISOString().split("T")[0],
              eventTime: ci.eventTime,
              eventLocation: ci.eventLocation,
              eventCategory: ci.eventCategory,
              ticketType: ci.ticketType || "General",
              seatType: ci.seatType || "general",
              price: ci.ticketPrice,
              quantity: ci.quantity,
              buyerEmail: formData.email,
              buyerFullName: formData.fullName,
              buyerAddress: formData.address,
            }))
          : [
              {
                eventId: pageData.id || 1,
                eventName: pageData.title || "Evento",
                eventDate:
                  pageData.date || new Date().toISOString().split("T")[0],
                eventTime: pageData.time,
                eventLocation: pageData.location,
                eventCategory:
                  pageData.category || pageData.eventCategory || undefined,
                ticketType: pageData.ticketType || "General",
                seatType: pageData.seatType || "general",
                price: total,
                quantity: quantity,
                buyerEmail: checkoutInfo.email || '',
                buyerFullName: checkoutInfo.fullName || '',
                buyerAddress: [
                  checkoutInfo.address,
                  checkoutInfo.city,
                  checkoutInfo.state,
                  checkoutInfo.zipCode,
                  checkoutInfo.country
                ].filter(Boolean).join(', '),
              },
            ];

      setCryptoOrderId(orderId);
      // Exponer detalles por si se requiere en otras integraciones/depuración
      (window as any).__CRYPTO_ORDER__ = { orderId, items };

      setShowCryptoModal(true);
      return;
    }

    setLoading(true);

    try {
      // Método ACH: mostrar confirmación y procesar
      if (paymentMethod === "ach") {
        toast.success("Instrucciones de pago ACH enviadas por email");
        // Aquí podrías enviar un email con las instrucciones de pago
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      // Método gratuito: procesar inmediatamente sin simular pago
      if (paymentMethod !== "free" && paymentMethod !== "ach") {
        // Simular procesamiento de pago para otros métodos
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Obtener IDs de categoría y método de pago
      const ticketCategory =
        ticketCategories.find(
          (cat) =>
            cat.name === (pageData.ticketClass?.toUpperCase() || "GENERAL"),
        ) || ticketCategories.find((cat) => cat.name === "GENERAL");

      // Para método gratuito, usar un método de pago especial o crear uno temporal
      const paymentMethodObj =
        paymentMethod === "free"
          ? { id: null, name: "free" } // Método gratuito no requiere ID real
          : paymentMethods.find((method) => method.name === paymentMethod) ||
            paymentMethods.find((method) => method.name === "balance");

      // Crear boletas para cada ticket comprado
      const tickets: any[] = [];
      const purchaseId = crypto.randomUUID();

      // Si hay items del carrito, procesar todos los items
      if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
        // Procesar todos los items del carrito
        for (const cartItem of cartItems) {
          const itemTicketCategory =
            ticketCategories.find(
              (cat) =>
                cat.name === (cartItem.ticketType?.toUpperCase() || "GENERAL"),
            ) || ticketCategories.find((cat) => cat.name === "GENERAL");

          // Crear tickets para cada cantidad del item
          for (let i = 0; i < cartItem.quantity; i++) {
            const ticketData: TicketData = {
              eventId: cartItem.eventId,
              eventName: cartItem.eventName,
              eventDate:
                cartItem.eventDate || new Date().toISOString().split("T")[0],
              eventTime: cartItem.eventTime,
              eventLocation: cartItem.eventLocation,
              eventCategory: cartItem.eventCategory,
              buyerId: user?.id,
              buyerEmail: formData.email,
              buyerFullName: formData.fullName,
              buyerAddress: formData.address,
              ticketType: cartItem.ticketType || "General",
              seatNumber: cartItem.seatNumber || undefined,
              seatType: cartItem.seatType || "numerado",
              gateNumber: undefined,
              ticketClass: cartItem.ticketType || "General",
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
                purchaseDate: new Date().toISOString(),
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
            eventName: pageData.title || "Evento",
            eventDate: pageData.date || new Date().toISOString().split("T")[0],
            eventTime: pageData.time,
            eventLocation: pageData.location,
            eventCategory:
              pageData.category || pageData.eventCategory || undefined,
            buyerId: user?.id,
            buyerEmail: formData.email,
            buyerFullName: formData.fullName,
            buyerAddress: "", // Se puede agregar campo de dirección si es necesario
            ticketType: pageData.ticketType || "General",
            seatNumber: pageData.seatNumber || undefined,
            seatType: pageData.seatType || "numerado", // numerado, general, preferencial
            gateNumber: pageData.gateNumber || undefined,
            ticketClass: pageData.ticketClass || "VIP",
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
              purchaseDate: new Date().toISOString(),
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
      const { sendTicketPinEmail } = await import(
        "../utils/tickets/ticketService"
      );
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
              ticket.event_date,
            );
            console.log(
              `PIN enviado por email para ticket ${ticket.ticket_code}`,
            );
          } catch (emailError) {
            console.warn(
              `No se pudo enviar el PIN por email para ticket ${ticket.ticket_code}:`,
              emailError,
            );
            // No bloquear el flujo si falla el envío de email
          }
        }
      }

      setCreatedTickets(tickets);
      setLoading(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error creating tickets:", error);
      alert("Error al crear las boletas. Por favor, contacta al soporte.");
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
      total: total,
    });
  };

  const handleCryptoPaymentSuccess = async (txId: string) => {
    // No crear tickets en frontend; el webhook los generará al confirmar el pago
    setShowCryptoModal(false);
    setLoading(false);
    setShowSuccessModal(true);
    toast.success(
      "Pago cripto recibido. Generaremos tus tickets al confirmar la transacción.",
    );
  };

  const handleCryptoPaymentError = (error: string) => {
    toast.error(`Error en el pago: ${error}`);
    setShowCryptoModal(false);
  };

  const paymentMethodOptions = [
    {
      id: "card" as PaymentMethod,
      name: "Tarjeta de Crédito/Débito",
      icon: <CreditCard className="h-5 w-5" />,
      description: "Visa, Mastercard, American Express",
    },
    // ⚠️ ACH DESHABILITADO TEMPORALMENTE
    // Requiere confirmación manual (1-3 días)
    // Necesita panel administrativo para aprobar transacciones pendientes
    // Descomentar cuando esté implementado el panel admin
    /*
    {
      id: "ach" as PaymentMethod,
      name: "Transferencia ACH",
      icon: <Building2 className="h-5 w-5" />,
      description: "Transferencia bancaria en EE.UU.",
    },
    */
    // ⚠️ CRYPTOMUS DESHABILITADO TEMPORALMENTE
    // Esperando activación de API después de pasar moderación
    // Meta tag agregada: <meta name="cryptomus" content="96ff3fc4" />
    // Descomentar cuando la API esté activa
    /*
    {
      id: "crypto" as PaymentMethod,
      name: "Criptomonedas",
      icon: <Bitcoin className="h-5 w-5" />,
      description: "Bitcoin, Ethereum, USDT",
    },
    */
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

      <div className="container mx-auto px-2 min-[375px]:px-3 sm:px-4 py-3 min-[375px]:py-4 sm:py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-3 min-[375px]:mb-4 sm:mb-8 text-xl min-[375px]:text-2xl sm:text-3xl font-bold !text-white">Checkout</h1>

          <div className="grid gap-3 min-[375px]:gap-4 sm:gap-8 lg:grid-cols-3">
            {/* Formulario de Pago */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-3 min-[375px]:space-y-4 sm:space-y-6">
                {/* Información de Contacto */}
                <Card className="p-4 min-[375px]:p-5 sm:p-6 !bg-white/5 border-white/20">
                  <h2 className="mb-4 flex items-center gap-2 text-lg sm:text-xl font-bold !text-white">
                    <User className="h-5 w-5" />
                    Información de Contacto
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Nombre Completo */}
                    <div>
                      <Label htmlFor="fullName" className="!text-white/80 mb-2 block">
                        Nombre Completo *
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 !text-white/40" />
                        <Input
                          id="fullName"
                          type="text"
                          value={checkoutInfo.fullName}
                          onChange={(e) => useCheckoutStore.getState().setCheckoutInfo({ fullName: e.target.value })}
                          className="pl-11 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40 h-12"
                          placeholder="Juan Pérez"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <Label htmlFor="email" className="!text-white/80 mb-2 block">
                        Correo Electrónico *
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 !text-white/40" />
                        <Input
                          id="email"
                          type="email"
                          value={checkoutInfo.email}
                          onChange={(e) => useCheckoutStore.getState().setCheckoutInfo({ email: e.target.value })}
                          className="pl-11 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40 h-12"
                          placeholder="juan@ejemplo.com"
                          required
                        />
                      </div>
                      <p className="text-xs !text-white/50 mt-1">
                        Tus boletos se enviarán a este correo
                      </p>
                    </div>

                    {/* Teléfono */}
                    <div>
                      <Label htmlFor="phone" className="!text-white/80 mb-2 block">
                        Teléfono *
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 !text-white/40" />
                        <Input
                          id="phone"
                          type="tel"
                          value={checkoutInfo.phone}
                          onChange={(e) => useCheckoutStore.getState().setCheckoutInfo({ phone: e.target.value })}
                          className="pl-11 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40 h-12"
                          placeholder="+57 300 1234567"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </Card>
                
                {/* Información sobre entrega digital */}
                <Card className="p-4 min-[375px]:p-5 sm:p-6 !bg-blue-500/20 border-2 border-blue-400/50">
                  <div className="flex items-start gap-3">
                    <Ticket className="h-6 w-6 min-[375px]:h-7 min-[375px]:w-7 sm:h-8 sm:w-8 !text-blue-300 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-base min-[375px]:text-lg sm:text-xl font-bold !text-blue-100 mb-2">
                        📧 Boletos Digitales
                      </h3>
                      <p className="text-sm min-[375px]:text-base sm:text-lg !text-blue-50 leading-relaxed mb-2">
                        Tus boletos llegarán <span className="font-bold">instantáneamente</span> a tu correo con un PIN de seguridad.
                      </p>
                      <p className="text-xs min-[375px]:text-sm !text-blue-200 leading-relaxed">
                        💡 <span className="font-semibold">Nota:</span> Solo necesitas agregar una dirección si pagas con tarjeta de crédito (requerido por Stripe).
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Método de Pago */}
                <Card className="p-2.5 min-[375px]:p-3 sm:p-4 md:p-6 !bg-white/5 border-white/20">
                  <h2 className="mb-3 min-[375px]:mb-4 sm:mb-6 flex items-center gap-1.5 sm:gap-2 text-base min-[375px]:text-lg sm:text-xl font-bold !text-white">
                    <Wallet className="h-3.5 w-3.5 min-[375px]:h-4 min-[375px]:w-4 sm:h-5 sm:w-5" />
                    <span className="leading-tight">Método de Pago</span>
                  </h2>

                  <div className="grid gap-2 min-[375px]:gap-2.5 sm:gap-3 md:gap-4 grid-cols-2 sm:grid-cols-3">
                    {paymentMethodOptions.map((method) => (
                      <div
                        key={method.id}
                        className={`relative flex flex-col items-center justify-center rounded-lg sm:rounded-xl border-2 p-2 min-[375px]:p-2.5 sm:p-3 md:p-6 cursor-pointer transition-all hover:scale-105 ${
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
                          <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 flex h-4 w-4 min-[375px]:h-5 min-[375px]:w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-[#c61619]">
                            <CheckCircle2 className="h-2.5 w-2.5 min-[375px]:h-3 min-[375px]:w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                        )}

                        <div
                          className={`mb-1.5 min-[375px]:mb-2 sm:mb-3 flex h-8 w-8 min-[375px]:h-10 min-[375px]:w-10 sm:h-16 sm:w-16 items-center justify-center rounded-full transition-all ${
                            paymentMethod === method.id
                              ? "bg-[#c61619] text-white"
                              : "bg-white/10 text-white/70"
                          }`}
                        >
                          <div className="scale-75 min-[375px]:scale-100 sm:scale-150">{method.icon}</div>
                        </div>

                        <Label
                          htmlFor={method.id}
                          className="text-center !text-white font-bold cursor-pointer mb-0 min-[375px]:mb-1 sm:mb-2 text-[10px] min-[375px]:text-xs sm:text-sm leading-tight px-0.5"
                        >
                          {method.name}
                        </Label>

                        <p className="hidden sm:block text-xs text-center !text-white/60">
                          {method.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Formulario según método de pago */}
                <Card className="p-2.5 min-[375px]:p-3 sm:p-4 md:p-6 !bg-white/5 border-white/20">
                  <h2 className="mb-3 min-[375px]:mb-4 flex items-center gap-1.5 sm:gap-2 text-base min-[375px]:text-lg sm:text-xl font-bold !text-white">
                    <Lock className="h-4 w-4 min-[375px]:h-5 min-[375px]:w-5" />
                    <span className="leading-tight">Información de Pago</span>
                  </h2>

                  {/* Tarjeta de Crédito/Débito - Redirige a Stripe Checkout */}
                  {paymentMethod === "card" && (
                    <div
                      key="card-form"
                      className="space-y-2.5 min-[375px]:space-y-3 sm:space-y-4 animate-fade-in-up"
                    >
                      {/* Formulario de Dirección - Solo para pagos con tarjeta */}
                      <div className="mb-4">
                        <AddressForm onAddressValid={setIsAddressValid} />
                          </div>

                      {/* Info sobre Stripe Checkout */}
                      <div className="rounded-lg !bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-400/30 p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 border border-blue-400/40">
                            <Lock className="h-5 w-5 !text-blue-300" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold !text-white mb-1">
                              🔐 Pago Seguro con Stripe
                            </h4>
                            <p className="text-xs !text-white/80 leading-relaxed">
                              Al hacer clic en "Proceder al Pago", serás redirigido a la plataforma segura de Stripe para completar tu pago. Tus datos de tarjeta nunca pasan por nuestros servidores.
                            </p>
                        </div>
                      </div>

                        {/* Logos de tarjetas aceptadas */}
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-white/10">
                          <span className="text-xs !text-white/60">Aceptamos:</span>
                          <div className="flex gap-2">
                            <div className="h-7 px-3 flex items-center justify-center rounded bg-white/10 border border-white/20">
                              <span className="text-xs font-bold !text-white">VISA</span>
                        </div>
                            <div className="h-7 px-3 flex items-center justify-center rounded bg-white/10 border border-white/20">
                              <span className="text-xs font-bold !text-white">MC</span>
                      </div>
                            <div className="h-7 px-3 flex items-center justify-center rounded bg-white/10 border border-white/20">
                              <span className="text-xs font-bold !text-white">AMEX</span>
                          </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ACH Transfer - Optimizado 320px */}
                  {paymentMethod === "ach" && (
                    <div
                      key="ach-form"
                      className="space-y-2.5 min-[375px]:space-y-3 sm:space-y-4 animate-fade-in-up"
                    >
                      {/* Info banner */}
                      <div className="flex items-start gap-2 min-[375px]:gap-2.5 sm:gap-3 rounded-lg !bg-blue-500/10 p-2.5 min-[375px]:p-3 sm:p-4 border border-blue-500/20">
                        <Building2 className="h-4 w-4 min-[375px]:h-5 min-[375px]:w-5 !text-blue-300 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs min-[375px]:text-sm !text-blue-300 font-semibold mb-0.5 min-[375px]:mb-1 leading-tight">
                            Transferencia ACH
                          </p>
                          <p className="text-[10px] min-[375px]:text-xs !text-blue-200/80 leading-tight">
                            Tardan 1-3 días. Recibirás tickets por email.
                          </p>
                        </div>
                      </div>

                      {/* Información bancaria para recibir el pago */}
                      <div className="rounded-lg !bg-white/5 border border-white/20 p-2.5 min-[375px]:p-3 sm:p-4 space-y-2 min-[375px]:space-y-2.5 sm:space-y-3">
                        <h4 className="text-xs min-[375px]:text-sm font-semibold !text-white flex items-center gap-1.5 sm:gap-2">
                          <Building2 className="h-3.5 w-3.5 min-[375px]:h-4 min-[375px]:w-4 !text-[#c61619]" />
                          <span className="leading-tight">Cuenta Destino</span>
                        </h4>
                        <div className="space-y-1.5 min-[375px]:space-y-2 text-xs min-[375px]:text-sm">
                          <div className="flex justify-between py-1.5 min-[375px]:py-2 border-b border-white/10 gap-2">
                            <span className="!text-white/60 text-[11px] min-[375px]:text-xs sm:text-sm">Cuenta:</span>
                            <span className="!text-white font-mono font-semibold text-right text-[11px] min-[375px]:text-xs sm:text-sm">Trackwise LLC</span>
                        </div>
                          <div className="flex justify-between py-1.5 min-[375px]:py-2 border-b border-white/10 gap-2">
                            <span className="!text-white/60 text-[11px] min-[375px]:text-xs sm:text-sm">Banco:</span>
                            <span className="!text-white font-mono font-semibold text-right text-[11px] min-[375px]:text-xs sm:text-sm">Lead Bank</span>
                      </div>
                          <div className="flex justify-between py-1.5 min-[375px]:py-2 border-b border-white/10 gap-2">
                            <span className="!text-white/60 text-[11px] min-[375px]:text-xs sm:text-sm">Routing:</span>
                            <span className="!text-white font-mono font-semibold text-right text-[11px] min-[375px]:text-xs sm:text-sm">101019644</span>
                        </div>
                          <div className="flex justify-between py-1.5 min-[375px]:py-2 gap-2">
                            <span className="!text-white/60 text-[11px] min-[375px]:text-xs sm:text-sm">Account:</span>
                            <span className="!text-white font-mono font-semibold text-right text-[11px] min-[375px]:text-xs sm:text-sm break-all">211494968626</span>
                      </div>
                            </div>
                        <div className="flex items-start gap-1.5 sm:gap-2 mt-2 min-[375px]:mt-2.5 sm:mt-3 p-2 min-[375px]:p-2.5 sm:p-3 rounded-lg !bg-yellow-500/10 border border-yellow-500/20">
                          <Shield className="h-3.5 w-3.5 min-[375px]:h-4 min-[375px]:w-4 !text-yellow-300 mt-0.5 flex-shrink-0" />
                          <p className="text-[10px] min-[375px]:text-xs !text-yellow-200/90 leading-tight">
                            <strong>Importante:</strong> Transfiere a esta cuenta. Recibirás tickets por email.
                          </p>
                            </div>
                          </div>

                      {/* Instrucciones de pago */}
                      <div className="rounded-lg !bg-white/5 border border-white/20 p-2.5 min-[375px]:p-3 sm:p-4 space-y-2 min-[375px]:space-y-2.5 sm:space-y-3">
                        <h4 className="text-xs min-[375px]:text-sm font-semibold !text-white flex items-center gap-1.5 sm:gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 min-[375px]:h-4 min-[375px]:w-4 !text-green-400" />
                          <span className="leading-tight">Instrucciones</span>
                        </h4>
                        <ol className="space-y-1.5 min-[375px]:space-y-2 text-[11px] min-[375px]:text-xs sm:text-sm !text-white/80 list-decimal list-inside leading-tight pl-1">
                          <li className="leading-relaxed">Transfiere ACH desde tu banco a la cuenta arriba</li>
                          <li className="leading-relaxed">Referencia: <span className="font-mono !text-[#c61619] text-[10px] min-[375px]:text-[11px] sm:text-xs break-all">{checkoutInfo.email}</span></li>
                          <li className="leading-relaxed">Monto: <span className="font-semibold !text-white">${total.toLocaleString()} USD</span></li>
                          <li className="leading-relaxed">Recibirás tickets por email (1-3 días)</li>
                        </ol>
                      </div>

                      {/* Confirmación del cliente */}
                      <div className="flex items-start gap-2 min-[375px]:gap-2.5 sm:gap-3 p-2.5 min-[375px]:p-3 sm:p-4 rounded-lg !bg-white/5 border border-white/20">
                        <input
                          type="checkbox"
                          id="ach-confirmation"
                          className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/10 text-[#c61619] focus:ring-[#c61619] focus:ring-offset-0 flex-shrink-0"
                          required
                        />
                        <label htmlFor="ach-confirmation" className="text-[11px] min-[375px]:text-xs sm:text-sm !text-white/90 leading-tight">
                          Confirmo que realizaré la transferencia ACH y entiendo que 
                          los tickets serán enviados una vez confirmado (1-3 días).
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Método Gratuito */}
                  {paymentMethod === "free" && (
                    <div
                      key="free-form"
                      className="space-y-4 animate-fade-in-up"
                    >
                      <div className="rounded-lg !bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-6 border border-green-500/30 backdrop-blur">
                        <div className="flex items-start gap-3 mb-4">
                          <Gift className="h-6 w-6 !text-green-300 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-lg !text-green-300 font-bold mb-2">
                              Método de Pago Gratuito (Prueba)
                            </p>
                            <p className="text-sm !text-green-200/80 mb-3">
                              Este método está disponible solo para pruebas. No
                              se realizará ningún cargo y los tickets se
                              generarán inmediatamente.
                            </p>
                            <div className="flex items-center gap-2 text-xs !text-green-200/70 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>
                                Ideal para probar la generación de boletas y el
                                sistema de tickets
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Crypto - Cryptomus maneja todo */}
                  {paymentMethod === "crypto" && (
                    <div
                      key="crypto-form"
                      className="space-y-5 animate-fade-in-up"
                    >
                      <div className="rounded-lg !bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 border-2 border-purple-500/30 backdrop-blur">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Bitcoin className="h-7 w-7 text-white" />
                            </div>
                          <div className="flex-1">
                            <h4 className="text-xl font-bold !text-purple-100 mb-2">
                              💎 Pago con Criptomonedas
                            </h4>
                            <p className="text-sm !text-purple-200/90 leading-relaxed">
                              Al hacer clic en <strong>"Pagar con Crypto"</strong>, serás redirigido a <strong className="!text-purple-100">Cryptomus</strong>, donde podrás seleccionar tu criptomoneda y red preferida de forma segura.
                            </p>
                              </div>
                            </div>

                        <div className="space-y-3 mb-5">
                          <div className="flex items-center gap-3 text-sm !text-purple-200/90">
                            <div className="h-6 w-6 rounded-full bg-purple-400/20 flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="h-4 w-4 !text-purple-300" />
                              </div>
                            <span><strong>Múltiples monedas:</strong> BTC, ETH, USDT, BNB, TRX y más</span>
                            </div>
                          <div className="flex items-center gap-3 text-sm !text-purple-200/90">
                            <div className="h-6 w-6 rounded-full bg-purple-400/20 flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="h-4 w-4 !text-purple-300" />
                          </div>
                            <span><strong>Redes flexibles:</strong> Elige entre Ethereum, BSC, Tron, Polygon y más</span>
                      </div>
                          <div className="flex items-center gap-3 text-sm !text-purple-200/90">
                            <div className="h-6 w-6 rounded-full bg-purple-400/20 flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="h-4 w-4 !text-purple-300" />
                        </div>
                            <span><strong>Confirmación automática</strong> al recibir la transacción</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm !text-purple-200/90">
                            <div className="h-6 w-6 rounded-full bg-purple-400/20 flex items-center justify-center flex-shrink-0">
                              <Ticket className="h-4 w-4 !text-purple-300" />
                            </div>
                            <span><strong>Boletos instantáneos</strong> enviados a tu correo con PIN de seguridad</span>
                          </div>
                      </div>

                        <div className="p-5 rounded-lg bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-2 border-purple-400/40 shadow-lg">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-base !text-purple-200/90 font-semibold">
                              Total a pagar:
                            </span>
                            <span className="text-3xl font-bold !text-purple-50">
                              ${total.toLocaleString()} USD
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 !text-purple-300 flex-shrink-0" />
                            <p className="text-xs !text-purple-200/80 leading-relaxed">
                              El equivalente exacto en tu criptomoneda seleccionada se calculará en tiempo real según el tipo de cambio actual
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-xs !text-purple-200/70 bg-purple-500/10 p-3 rounded-lg border border-purple-400/20">
                          <Shield className="h-4 w-4 !text-purple-300 flex-shrink-0" />
                          <span>
                            Plataforma segura y confiable · Sin comisiones ocultas · Soporte 24/7
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 rounded-lg !bg-white/5 p-3 border border-white/10 mt-4">
                    <Shield className="h-4 w-4 !text-green-400" />
                    <p className="text-sm !text-white/70">
                      Tu información está protegida con encriptación SSL de 256
                      bits
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
                      ) : paymentMethod === "card" ? (
                        <>
                          <Lock className="mr-2 h-5 w-5" />
                          Proceder al Pago Seguro - ${total.toLocaleString()} USD
                        </>
                      ) : paymentMethod === "crypto" ? (
                        <>
                          <Bitcoin className="mr-2 h-5 w-5" />
                          Pagar con Crypto - ${total.toLocaleString()} USD
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-5 w-5" />
                          {paymentMethod === "ach"
                            ? "Autorizar Transferencia"
                            : "Pagar"}{" "}
                          ${total.toLocaleString()} USD
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
                      <h4 className="font-bold !text-white mb-3 text-lg">
                        {pageData.title}
                      </h4>
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
                          <span className="capitalize !text-white/90 font-medium">
                            {pageData.selectedTicketType || "General"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator className="!bg-white/20" />

                    {/* Cantidad - Mejorado */}
                    <div>
                      <Label className="!text-white mb-3 block font-semibold text-base">
                        Cantidad de Entradas
                      </Label>

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
                          <div className="text-3xl font-bold !text-white mb-1">
                            {quantity}
                          </div>
                          <div className="text-xs !text-white/60">
                            {quantity === 1 ? "entrada" : "entradas"}
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
                        <Label className="!text-white/70 mb-2 block text-xs">
                          O selecciona rápidamente:
                        </Label>
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
                          <span className="!text-white/80">
                            Precio por entrada
                          </span>
                          <span className="font-semibold !text-white">
                            ${ticketPrice.toLocaleString()} USD
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator className="!bg-white/20" />

                    {/* Desglose de Precios - Mejorado */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="!text-white font-medium">
                            Subtotal
                          </div>
                          <div className="text-xs !text-white/60">
                            {quantity} {quantity === 1 ? "entrada" : "entradas"}{" "}
                            × ${ticketPrice.toLocaleString()}
                          </div>
                        </div>
                        <span className="font-semibold !text-white">
                          ${subtotal.toLocaleString()} USD
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="!text-white/80 font-medium text-sm">
                            Cargo por servicio
                          </div>
                          <div className="text-xs !text-white/50">
                            10% del subtotal
                          </div>
                        </div>
                        <span className="font-semibold !text-white/80">
                          ${serviceFee.toLocaleString()} USD
                        </span>
                      </div>
                      <Separator className="!bg-white/30" />
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-bold !text-white">
                          {paymentMethod === "free" ? "Total" : "Total a pagar"}
                        </span>
                        <span
                          className={`text-2xl font-bold ${
                            paymentMethod === "free"
                              ? "!text-green-400"
                              : "!text-[#c61619]"
                          }`}
                        >
                          {paymentMethod === "free"
                            ? "GRATIS"
                            : `$${total.toLocaleString()} USD`}
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
              <p className="text-sm !text-white/70 mb-2">
                Detalles de la compra:
              </p>
              <div className="space-y-1 text-sm">
                <p className="!text-white">
                  <strong>Evento:</strong> {pageData.title}
                </p>
                <p className="!text-white">
                  <strong>Cantidad:</strong> {quantity}{" "}
                  {quantity === 1 ? "ticket" : "tickets"}
                </p>
                <p className="!text-white">
                  <strong>Método de pago:</strong>{" "}
                  {paymentMethod === "free"
                    ? "Gratis (Prueba)"
                    : paymentMethod === "card"
                      ? "Tarjeta"
                      : paymentMethod === "ach"
                        ? "ACH Transfer"
                        : "Criptomonedas"}
                </p>
                <p className="!text-white">
                  <strong>Total:</strong>{" "}
                  {paymentMethod === "free"
                    ? "GRATIS"
                    : `$${total.toLocaleString()} USD`}
                </p>
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

      {/* Modal de pago con criptomonedas */}
      <CryptoPaymentModal
        isOpen={showCryptoModal}
        onClose={() => setShowCryptoModal(false)}
        amount={total}
        currency="USD"
        orderId={cryptoOrderId}
        onSuccess={handleCryptoPaymentSuccess}
        onError={handleCryptoPaymentError}
        // Pasar detalle de compra para incluir en additional_data del invoice
        additionalData={JSON.stringify({
          orderId: cryptoOrderId,
          amount: total,
          currency: "USD",
          buyer: {
            fullName: formData.fullName,
            email: formData.email,
            address: formData.address,
          },
          items:
            cartItems && Array.isArray(cartItems) && cartItems.length > 0
              ? cartItems.map((ci) => ({
                  eventId: ci.eventId,
                  eventName: ci.eventName,
                  eventDate:
                    ci.eventDate || new Date().toISOString().split("T")[0],
                  eventTime: ci.eventTime,
                  eventLocation: ci.eventLocation,
                  eventCategory: ci.eventCategory,
                  ticketType: ci.ticketType || "General",
                  seatType: ci.seatType || "general",
                  price: ci.ticketPrice,
                  quantity: ci.quantity,
                }))
              : [
                  {
                    eventId: pageData.id || 1,
                    eventName: pageData.title || "Evento",
                    eventDate:
                      pageData.date || new Date().toISOString().split("T")[0],
                    eventTime: pageData.time,
                    eventLocation: pageData.location,
                    eventCategory:
                      pageData.category || pageData.eventCategory || undefined,
                    ticketType: pageData.ticketType || "General",
                    seatType: pageData.seatType || "general",
                    price: total,
                    quantity: quantity,
                  },
                ],
        })}
      />
    </div>
  );
}
