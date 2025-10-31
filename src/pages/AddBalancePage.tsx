import { useState, useEffect } from "react";
import { ChevronLeft, Wallet, CreditCard, DollarSign, TrendingUp, Check, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { useRouter } from "../hooks/useRouter";
import { useAuth } from "../hooks/useAuth";
import { api } from "../utils/api";
import { CurrencySelector } from "../components/CurrencySelector";
import { MultiCurrencyBalance } from "../components/MultiCurrencyBalance";
import { Currency, formatCurrency, CURRENCIES } from "../utils/currency";
import { toast } from "sonner";

// Montos sugeridos por moneda
const SUGGESTED_AMOUNTS: Record<Currency, number[]> = {
  USD: [10, 25, 50, 100, 250, 500],
  MXN: [200, 500, 1000, 2000, 5000, 10000],
  BRL: [50, 100, 250, 500, 1000, 2000],
  EUR: [10, 25, 50, 100, 250, 500],
};

// Métodos de pago simulados
const PAYMENT_METHODS = [
  {
    id: "card",
    name: "Tarjeta de Crédito/Débito",
    icon: CreditCard,
    description: "Visa, Mastercard, American Express",
    popular: true,
  },
  {
    id: "paypal",
    name: "PayPal",
    icon: Wallet,
    description: "Pago seguro con PayPal",
  },
  {
    id: "transfer",
    name: "Transferencia Bancaria",
    icon: DollarSign,
    description: "SPEI, ACH, o transferencia local",
  },
];

export function AddBalancePage() {
  const { navigate } = useRouter();
  const { user, refreshUser } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("USD");
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Sync with user's preferred currency
  useEffect(() => {
    if (user?.preferredCurrency) {
      setSelectedCurrency(user.preferredCurrency);
    }
  }, [user?.preferredCurrency]);

  useEffect(() => {
    if (!user) {
      navigate("login");
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const getFinalAmount = (): number => {
    if (selectedAmount) return selectedAmount;
    const custom = parseFloat(customAmount);
    return isNaN(custom) ? 0 : custom;
  };

  const finalAmount = getFinalAmount();
  const processingFee = finalAmount * 0.03; // 3% fee
  const totalAmount = finalAmount + processingFee;

  const handleAddBalance = async () => {
    if (finalAmount <= 0) {
      setError("Por favor ingresa un monto válido");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Simular procesamiento de pago
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Agregar balance
      await api.addBalance(finalAmount, selectedCurrency);
      await refreshUser();

      setSuccess(true);
      toast.success(`¡Saldo agregado! ${formatCurrency(finalAmount, selectedCurrency)} añadidos a tu cuenta`);

      // Resetear formulario
      setTimeout(() => {
        setSelectedAmount(null);
        setCustomAmount("");
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Error al procesar el pago");
      toast.error("Error al agregar saldo");
    } finally {
      setLoading(false);
    }
  };

  const suggestedAmounts = SUGGESTED_AMOUNTS[selectedCurrency];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("profile")}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver al Perfil
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-5xl">
          {/* Page Title */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-full">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Recarga Rápida y Segura</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Agregar Saldo
            </h1>
            <p className="text-gray-600">
              Recarga tu cuenta para comprar tickets de tus eventos favoritos
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Payment Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Currency Selection */}
              <Card className="p-6 bg-white shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      Selecciona la Moneda
                    </h2>
                    <p className="text-sm text-gray-600">
                      Elige la moneda en la que deseas agregar saldo
                    </p>
                  </div>
                  <CurrencySelector
                    selectedCurrency={selectedCurrency}
                    onCurrencyChange={setSelectedCurrency}
                    showLabel={false}
                  />
                </div>

                <Separator className="my-6" />

                {/* Suggested Amounts */}
                <div className="mb-6">
                  <Label className="mb-3 block text-base font-semibold">
                    Montos Sugeridos
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {suggestedAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => handleAmountSelect(amount)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedAmount === amount
                            ? "border-blue-600 bg-blue-50 shadow-md"
                            : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="text-center">
                          <div
                            className={`text-lg font-bold ${
                              selectedAmount === amount
                                ? "text-blue-600"
                                : "text-gray-900"
                            }`}
                          >
                            {formatCurrency(amount, selectedCurrency)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount */}
                <div className="mb-6">
                  <Label htmlFor="custom-amount" className="mb-2 block text-base font-semibold">
                    O ingresa un monto personalizado
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-gray-500">
                      {CURRENCIES[selectedCurrency].symbol}
                    </span>
                    <Input
                      id="custom-amount"
                      type="number"
                      placeholder="0.00"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      className="pl-12 pr-16 py-6 text-2xl font-semibold border-2 focus:border-blue-500"
                      step="0.01"
                      min="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-medium text-gray-400">
                      {selectedCurrency}
                    </span>
                  </div>
                  {finalAmount > 0 && (
                    <p className="mt-2 text-sm text-gray-600">
                      Monto a recargar: <span className="font-semibold">{formatCurrency(finalAmount, selectedCurrency)}</span>
                    </p>
                  )}
                </div>

                <Separator className="my-6" />

                {/* Payment Method */}
                <div>
                  <Label className="mb-4 block text-base font-semibold">
                    Método de Pago
                  </Label>
                  <RadioGroup
                    value={selectedPaymentMethod}
                    onValueChange={setSelectedPaymentMethod}
                  >
                    <div className="space-y-3">
                      {PAYMENT_METHODS.map((method) => {
                        const Icon = method.icon;
                        return (
                          <label
                            key={method.id}
                            className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-gray-200 p-4 transition-all hover:border-blue-300 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50"
                          >
                            <div className="flex items-center gap-4">
                              <RadioGroupItem value={method.id} id={method.id} />
                              <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-gray-100 p-2">
                                  <Icon className="h-5 w-5 text-gray-700" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Label
                                      htmlFor={method.id}
                                      className="cursor-pointer font-semibold text-gray-900"
                                    >
                                      {method.name}
                                    </Label>
                                    {method.popular && (
                                      <Badge variant="secondary" className="text-xs">
                                        Popular
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500">
                                    {method.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </RadioGroup>
                </div>
              </Card>

              {/* Error/Success Messages */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ¡Saldo agregado exitosamente! Ya puedes comprar tus tickets.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Current Balance */}
                <MultiCurrencyBalance
                  balance={user.balance}
                  selectedCurrency={selectedCurrency}
                  showAllCurrencies={true}
                />

                {/* Payment Summary */}
                <Card className="p-6 bg-white shadow-lg">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Resumen de Recarga
                  </h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Monto a recargar</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(finalAmount, selectedCurrency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Comisión (3%)</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(processingFee, selectedCurrency)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">Total a pagar</span>
                      <span className="text-xl font-bold text-blue-600">
                        {formatCurrency(totalAmount, selectedCurrency)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleAddBalance}
                    disabled={loading || finalAmount <= 0}
                    className="w-full py-6 text-lg"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Wallet className="mr-2 h-5 w-5" />
                        Agregar {formatCurrency(finalAmount, selectedCurrency)}
                      </>
                    )}
                  </Button>

                  <p className="mt-4 text-center text-xs text-gray-500">
                    🔒 Pago 100% seguro y encriptado
                  </p>
                </Card>

                {/* Benefits */}
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                  <h4 className="mb-3 font-semibold text-gray-900">
                    ✨ Beneficios de Recargar
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Compra instantánea de tickets</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Sin necesidad de ingresar tarjeta cada vez</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Transacciones seguras y rápidas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Soporte para múltiples monedas</span>
                    </li>
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
