import { useState, useEffect } from "react";
import { ChevronLeft, Wallet, CreditCard, Building2, Bitcoin, Lock, CheckCircle2, Gift } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useRouter } from "../hooks/useRouter";
import { useAuth } from "../hooks/useAuth";
import { api } from "../utils/api";
import { toast } from "sonner";
import { useLanguage } from "../hooks/useLanguage";

type PaymentMethod = "card" | "ach" | "crypto" | "free";

export function AddBalancePage() {
  const { navigate } = useRouter();
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Formulario de pago
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    if (!user) {
      navigate("login");
    }
  }, [user]);

  if (!user) {
    return null;
  }

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

  const amountValue = parseFloat(amount) || 0;
  const serviceFee = Math.round(amountValue * 0.03 * 100) / 100; // 3% fee
  const total = amountValue + serviceFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amountValue <= 0) {
      toast.error("Por favor ingresa un monto válido");
      return;
    }

    setLoading(true);
    
    try {
      // Método gratuito: procesar inmediatamente sin simular pago
      if (paymentMethod !== "free") {
        // Simular procesamiento de pago para otros métodos
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Agregar balance en USD
      await api.addBalance(amountValue, 'USD');
      await refreshUser();
      
      setShowSuccessModal(true);
      toast.success(`¡Saldo agregado! $${amountValue.toFixed(2)} USD añadidos a tu cuenta`);
      
      // Resetear formulario
      setAmount("");
      setFormData({
        cardNumber: "",
        cardExpiry: "",
        cardCVV: "",
        routingNumber: "",
        accountNumber: "",
        accountType: "checking",
        walletAddress: "",
        cryptoType: "bitcoin",
      });
    } catch (error) {
      console.error('Error adding balance:', error);
      toast.error('Error al procesar el pago. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    navigate("profile");
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

  const suggestedAmounts = [10, 25, 50, 100, 250, 500];

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-white/20 bg-black sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => navigate("profile")}
            className="gap-2 !text-white hover:!bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver al Perfil
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-3xl font-bold !text-white">Agregar Saldo</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Monto */}
            <Card className="p-6 !bg-black border-white/20">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold !text-white">
                <Wallet className="h-5 w-5" />
                Monto a Agregar (USD)
              </h2>
              
              {/* Montos sugeridos */}
              <div className="mb-4">
                <Label className="!text-white mb-3 block font-medium">Montos Sugeridos</Label>
                <div className="grid grid-cols-3 gap-3">
                  {suggestedAmounts.map((suggestedAmount) => (
                    <button
                      key={suggestedAmount}
                      type="button"
                      onClick={() => setAmount(suggestedAmount.toString())}
                      className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                        amount === suggestedAmount.toString()
                          ? "border-[#c61619] bg-[#c61619]/30 !text-white shadow-lg shadow-[#c61619]/20"
                          : "border-white/30 bg-white/5 hover:border-white/50 hover:bg-white/10 !text-white"
                      }`}
                    >
                      ${suggestedAmount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Monto personalizado */}
              <div>
                <Label htmlFor="amount" className="!text-white mb-2 block font-medium">O ingresa un monto personalizado</Label>
                <div className="relative mt-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold !text-white z-10">
                    $
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8 pr-16 py-3 !bg-white/10 border-white/30 !text-white placeholder:!text-white/50 focus:border-[#c61619] focus:ring-1 focus:ring-[#c61619]"
                    step="0.01"
                    min="0"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium !text-white/80">
                    USD
                  </span>
                </div>
              </div>
            </Card>

            {/* Método de Pago */}
            <Card className="p-6 !bg-black border-white/20">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold !text-white">
                <Lock className="h-5 w-5" />
                Selecciona tu Método de Pago
              </h2>
              
              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                {paymentMethodOptions.map((method) => (
                  <div
                    key={method.id}
                    className={`relative flex flex-col items-center justify-center rounded-xl border-2 p-6 cursor-pointer transition-all hover:scale-105 ${
                      paymentMethod === method.id
                        ? "border-[#c61619] !bg-[#c61619]/30 shadow-lg shadow-[#c61619]/20"
                        : "border-white/30 !bg-white/5 hover:border-white/50 hover:!bg-white/10"
                    }`}
                    onClick={() => {
                      console.log("Cambiando método de pago a:", method.id);
                      setPaymentMethod(method.id);
                    }}
                  >
                    {paymentMethod === method.id && (
                      <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#c61619] shadow-lg">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div className={`mb-3 p-3 rounded-full ${
                      paymentMethod === method.id ? "bg-[#c61619]/20" : "bg-white/10"
                    }`}>
                      <div className="!text-white">
                        {method.icon}
                      </div>
                    </div>
                    <h3 className="mb-1 text-center font-semibold !text-white text-sm">{method.name}</h3>
                    <p className="text-center text-xs !text-white/70">{method.description}</p>
                  </div>
                ))}
              </div>

              {/* Formularios de pago según método seleccionado */}
              {paymentMethod === "free" && (
                <div key="free-form" className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 pt-4 border-t border-white/20">
                  <div className="rounded-lg !bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-6 border border-green-500/30 backdrop-blur">
                    <div className="flex items-start gap-3 mb-4">
                      <Gift className="h-6 w-6 !text-green-300 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-lg !text-green-300 font-bold mb-2">
                          Método de Pago Gratuito (Prueba)
                        </p>
                        <p className="text-sm !text-green-200/80 mb-3">
                          Este método está disponible solo para pruebas. No se realizará ningún cargo y el saldo se agregará inmediatamente.
                        </p>
                        <div className="flex items-center gap-2 text-xs !text-green-200/70 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Ideal para probar la funcionalidad de agregar saldo</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "card" && (
                <div key="card-form" className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 pt-4 border-t border-white/20">
                  <div>
                    <Label htmlFor="cardNumber" className="!text-white mb-2 block font-medium">Número de Tarjeta *</Label>
                    <Input
                      id="cardNumber"
                      type="text"
                      value={formData.cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      className="!bg-white/10 border-white/30 !text-white placeholder:!text-white/50 focus:border-[#c61619] focus:ring-1 focus:ring-[#c61619]"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="cardExpiry" className="!text-white mb-2 block font-medium">Vencimiento *</Label>
                      <Input
                        id="cardExpiry"
                        type="text"
                        value={formData.cardExpiry}
                        onChange={(e) => handleExpiryChange(e.target.value)}
                        className="!bg-white/10 border-white/30 !text-white placeholder:!text-white/50 focus:border-[#c61619] focus:ring-1 focus:ring-[#c61619]"
                        placeholder="MM/AA"
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardCVV" className="!text-white mb-2 block font-medium">CVV *</Label>
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
                        className="!bg-white/10 border-white/30 !text-white placeholder:!text-white/50 focus:border-[#c61619] focus:ring-1 focus:ring-[#c61619] font-mono tracking-widest"
                        placeholder="•••"
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "ach" && (
                <div key="ach-form" className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 pt-4 border-t border-white/20">
                  <div className="rounded-lg border border-white/30 bg-white/10 p-4 mb-4">
                    <p className="text-sm !text-white">
                      <strong className="font-semibold">Instrucciones ACH:</strong> Proporciona los datos de tu cuenta bancaria. 
                      La transferencia se procesará en 1-3 días hábiles.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="routingNumber" className="!text-white mb-2 block font-medium">Número de Ruta (Routing Number) *</Label>
                    <Input
                      id="routingNumber"
                      type="text"
                      value={formData.routingNumber}
                      onChange={(e) => handleInputChange("routingNumber", e.target.value.replace(/\D/g, ""))}
                      className="!bg-white/10 border-white/30 !text-white placeholder:!text-white/50 focus:border-[#c61619] focus:ring-1 focus:ring-[#c61619]"
                      placeholder="123456789"
                      maxLength={9}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber" className="!text-white mb-2 block font-medium">Número de Cuenta *</Label>
                    <Input
                      id="accountNumber"
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                      className="!bg-white/10 border-white/30 !text-white placeholder:!text-white/50 focus:border-[#c61619] focus:ring-1 focus:ring-[#c61619]"
                      placeholder="0000000000"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountType" className="!text-white mb-2 block font-medium">Tipo de Cuenta *</Label>
                    <select
                      id="accountType"
                      value={formData.accountType}
                      onChange={(e) => handleInputChange("accountType", e.target.value)}
                      className="w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 !text-white focus:border-[#c61619] focus:outline-none focus:ring-1 focus:ring-[#c61619]"
                      required
                    >
                      <option value="checking" className="bg-black">Checking</option>
                      <option value="savings" className="bg-black">Savings</option>
                    </select>
                  </div>
                </div>
              )}

              {paymentMethod === "crypto" && (
                <div key="crypto-form" className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 pt-4 border-t border-white/20">
                  <div className="rounded-lg border border-white/30 bg-white/10 p-4 mb-4">
                    <p className="text-sm !text-white">
                      <strong className="font-semibold">Pago con Criptomonedas:</strong> Envía el monto exacto a la dirección 
                      que se mostrará después de confirmar. El saldo se acreditará una vez confirmada la transacción en la blockchain.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="cryptoType" className="!text-white mb-2 block font-medium">Tipo de Criptomoneda *</Label>
                    <select
                      id="cryptoType"
                      value={formData.cryptoType}
                      onChange={(e) => handleInputChange("cryptoType", e.target.value)}
                      className="w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 !text-white focus:border-[#c61619] focus:outline-none focus:ring-1 focus:ring-[#c61619]"
                      required
                    >
                      <option value="bitcoin" className="bg-black">Bitcoin (BTC)</option>
                      <option value="ethereum" className="bg-black">Ethereum (ETH)</option>
                      <option value="usdt" className="bg-black">USDT</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="walletAddress" className="!text-white mb-2 block font-medium">Dirección de Wallet *</Label>
                    <Input
                      id="walletAddress"
                      type="text"
                      value={formData.walletAddress}
                      onChange={(e) => handleInputChange("walletAddress", e.target.value)}
                      className="!bg-white/10 border-white/30 !text-white placeholder:!text-white/50 focus:border-[#c61619] focus:ring-1 focus:ring-[#c61619]"
                      placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                      required
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* Resumen */}
            <Card className="p-6 !bg-black border-white/20">
              <h2 className="mb-4 text-xl font-bold !text-white">Resumen</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="!text-white/90">Monto a agregar</span>
                  <span className="font-semibold !text-white">${amountValue.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="!text-white/90">Comisión (3%)</span>
                  <span className="font-semibold !text-white">${serviceFee.toFixed(2)} USD</span>
                </div>
                <div className="border-t border-white/30 pt-3 flex justify-between">
                  <span className="font-semibold !text-white text-base">
                    {paymentMethod === "free" ? "Total" : "Total a pagar"}
                  </span>
                  <span className={`text-xl font-bold ${
                    paymentMethod === "free" ? "!text-green-400" : "!text-[#c61619]"
                  }`}>
                    {paymentMethod === "free" ? "GRATIS" : `$${total.toFixed(2)} USD`}
                  </span>
                </div>
                {paymentMethod === "free" && (
                  <div className="mt-3 rounded-lg bg-green-500/10 border border-green-500/30 p-2">
                    <p className="text-xs !text-green-300 text-center">
                      🎁 Método de prueba - Sin cargo
                    </p>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || amountValue <= 0}
                className="mt-6 w-full bg-[#c61619] hover:bg-[#a01316] text-white py-6 text-lg"
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Procesando...
                  </>
                ) : (
                  <>
                    {paymentMethod === "free" ? (
                      <>
                        <Gift className="mr-2 h-5 w-5" />
                        Agregar ${amountValue.toFixed(2)} USD Gratis (Prueba)
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-5 w-5" />
                        Agregar ${amountValue.toFixed(2)} USD
                      </>
                    )}
                  </>
                )}
              </Button>
            </Card>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <Card className="p-8 max-w-md mx-4 !bg-black border-white/20">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="mb-2 text-2xl font-bold !text-white">¡Pago Exitoso!</h3>
              <p className="mb-6 !text-white/70">
                Se han agregado ${amountValue.toFixed(2)} USD a tu cuenta.
              </p>
              <Button
                onClick={handleCloseSuccess}
                className="w-full bg-[#c61619] hover:bg-[#a01316] text-white"
              >
                Volver al Perfil
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
