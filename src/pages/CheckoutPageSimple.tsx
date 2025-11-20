import React, { useState } from "react";
import { ChevronLeft, CreditCard, Lock, Ticket, Calendar, MapPin, User, Mail, Phone, CheckCircle2, Shield } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { ImageWithFallback } from "../components/media";
import { useRouter } from "../hooks/useRouter";
import { useAuth } from "../hooks/useAuth";
import { SEOHead } from "../components/common";

export function CheckoutPageSimple() {
  const { navigate, pageData } = useRouter();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Formulario
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    cardNumber: "",
    cardExpiry: "",
    cardCVV: "",
  });

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
    // Solo números y formatear con espacios cada 4 dígitos
    const cleaned = value.replace(/\D/g, "");
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, "$1 ");
    handleInputChange("cardNumber", formatted);
  };

  const handleExpiryChange = (value: string) => {
    // Formato MM/YY
    const cleaned = value.replace(/\D/g, "");
    let formatted = cleaned;
    if (cleaned.length >= 2) {
      formatted = cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    handleInputChange("cardExpiry", formatted);
  };

  const handleCVVChange = (value: string) => {
    // Solo 3 o 4 dígitos
    const cleaned = value.replace(/\D/g, "").slice(0, 4);
    handleInputChange("cardCVV", cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.fullName || !formData.email || !formData.phone) {
      alert("Por favor completa todos los campos de contacto");
      return;
    }
    
    if (!formData.cardNumber || !formData.cardExpiry || !formData.cardCVV) {
      alert("Por favor completa todos los datos de la tarjeta");
      return;
    }

    setLoading(true);
    
    // Simular procesamiento de pago
    setTimeout(() => {
      setLoading(false);
      setShowSuccessModal(true);
    }, 2000);
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    navigate("home");
  };

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
                  </div>
                </Card>

                {/* Información de Pago */}
                <Card className="p-6 !bg-white/5 border-white/20">
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-bold !text-white">
                    <CreditCard className="h-5 w-5" />
                    Información de Pago
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cardNumber" className="!text-white/80">Número de Tarjeta *</Label>
                      <Input
                        id="cardNumber"
                        type="text"
                        value={formData.cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        className="mt-1 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        required
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="cardExpiry" className="!text-white/80">Fecha de Vencimiento *</Label>
                        <Input
                          id="cardExpiry"
                          type="text"
                          value={formData.cardExpiry}
                          onChange={(e) => handleExpiryChange(e.target.value)}
                          className="mt-1 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40"
                          placeholder="MM/YY"
                          maxLength={5}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="cardCVV" className="!text-white/80">CVV *</Label>
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
                          className="mt-1 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40 font-mono tracking-widest"
                          placeholder="•••"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg !bg-white/5 p-3 border border-white/10">
                      <Lock className="h-4 w-4 !text-green-400" />
                      <p className="text-sm !text-white/70">
                        Tu información está protegida con encriptación SSL de 256 bits
                      </p>
                    </div>
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
                      <Shield className="mr-2 h-5 w-5" />
                      Pagar ${total.toLocaleString()} USD
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
                      <h4 className="font-bold !text-white mb-2">{pageData.title}</h4>
                      <div className="space-y-2 text-sm !text-white/70">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{pageData.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{pageData.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Ticket className="h-4 w-4" />
                          <span className="capitalize">{pageData.selectedTicketType || "General"}</span>
                        </div>
                      </div>
                    </div>

                    <Separator className="!bg-white/20" />

                    {/* Cantidad */}
                    <div>
                      <Label className="!text-white/80 mb-2 block">Cantidad de Tickets</Label>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                          className="h-10 w-10 !bg-white/10 border-white/20 !text-white hover:!bg-white/20"
                        >
                          -
                        </Button>
                        <span className="flex-1 text-center text-xl font-bold !text-white">{quantity}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(1)}
                          disabled={quantity >= 10}
                          className="h-10 w-10 !bg-white/10 border-white/20 !text-white hover:!bg-white/20"
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    <Separator className="!bg-white/20" />

                    {/* Desglose de Precios */}
                    <div className="space-y-2">
                      <div className="flex justify-between !text-white/70">
                        <span>Subtotal ({quantity} {quantity === 1 ? 'ticket' : 'tickets'})</span>
                        <span>${subtotal.toLocaleString()} USD</span>
                      </div>
                      <div className="flex justify-between !text-white/70">
                        <span>Cargo por servicio</span>
                        <span>${serviceFee.toLocaleString()} USD</span>
                      </div>
                      <Separator className="!bg-white/20" />
                      <div className="flex justify-between text-lg font-bold !text-white">
                        <span>Total</span>
                        <span>${total.toLocaleString()} USD</span>
                      </div>
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
              Tu compra ha sido procesada correctamente. Los tickets han sido enviados a tu email.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Card className="p-4 !bg-white/5 border-white/20">
              <p className="text-sm !text-white/70 mb-2">Detalles de la compra:</p>
              <div className="space-y-1 text-sm">
                <p className="!text-white"><strong>Evento:</strong> {pageData.title}</p>
                <p className="!text-white"><strong>Cantidad:</strong> {quantity} {quantity === 1 ? 'ticket' : 'tickets'}</p>
                <p className="!text-white"><strong>Total:</strong> ${total.toLocaleString()} USD</p>
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

