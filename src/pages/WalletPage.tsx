import { useState, useEffect } from "react";
import { Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp, DollarSign, ChevronLeft, Plus, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { useRouter } from "../hooks/useRouter";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { api, Transaction } from "../utils/api";
import { MultiCurrencyBalance, CurrencySelector } from "../components/payment";
import { Currency, formatCurrency, convertCurrency, CURRENCIES, EXCHANGE_RATES } from "../utils/currency";

export function WalletPage() {
  const { navigate } = useRouter();
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');

  // Sync selected currency with user preference
  useEffect(() => {
    if (user?.preferredCurrency) {
      setSelectedCurrency(user.preferredCurrency);
    }
  }, [user?.preferredCurrency]);

  useEffect(() => {
    if (!user) {
      navigate("login");
      return;
    }
    loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await api.getTransactions();
      setTransactions(data.transactions);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyChange = async (currency: Currency) => {
    setSelectedCurrency(currency);
    try {
      await api.updateCurrency(currency);
      await refreshUser();
    } catch (error) {
      console.error("Error updating currency:", error);
    }
  };

  if (!user) {
    return null;
  }

  // Calculate statistics
  const income = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenses = Math.abs(transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0));

  // Recent transactions (last 10)
  const recentTransactions = [...transactions].slice(0, 10);

  // Group transactions by month
  const transactionsByMonth = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const getMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-12">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("home")}
              className="rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mi Billetera</h1>
              <p className="text-gray-600">Gestiona tu saldo y transacciones</p>
            </div>
          </div>
          <Button
            className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:shadow-xl transition-shadow"
            onClick={() => navigate("add-balance")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Saldo
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Balance & Stats */}
          <div className="space-y-6 lg:col-span-2">
            {/* Main Balance Card */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-100">Saldo Total</p>
                      <p className="text-xs text-blue-200">Balance disponible</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={loadTransactions}
                  >
                    <RefreshCw className="h-5 w-5" />
                  </Button>
                </div>

                <div className="mb-6">
                  <div className="mb-2 text-5xl font-bold tracking-tight">
                    {formatCurrency(user.balance, selectedCurrency)}
                  </div>
                  <div className="flex items-center gap-2 text-blue-100">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">
                      En {CURRENCIES[selectedCurrency].name}
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="rounded-full bg-green-400/20 p-1.5">
                        <ArrowDownLeft className="h-4 w-4 text-green-300" />
                      </div>
                      <span className="text-sm text-blue-100">Ingresos</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(income, selectedCurrency)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="rounded-full bg-red-400/20 p-1.5">
                        <ArrowUpRight className="h-4 w-4 text-red-300" />
                      </div>
                      <span className="text-sm text-blue-100">Gastos</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(expenses, selectedCurrency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Multi-Currency Display */}
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Saldo en Diferentes Monedas</h3>
                </div>
                <MultiCurrencyBalance
                  balance={user.balance}
                  selectedCurrency={selectedCurrency}
                  showAllCurrencies={true}
                />
              </div>
            </Card>

            {/* Transactions */}
            <Card className="p-6">
              <Tabs defaultValue="recent" className="w-full">
                <TabsList className="mb-6 grid w-full grid-cols-2">
                  <TabsTrigger value="recent">Recientes</TabsTrigger>
                  <TabsTrigger value="all">Todas</TabsTrigger>
                </TabsList>

                {/* Recent Transactions */}
                <TabsContent value="recent">
                  <div className="space-y-1">
                    <h3 className="mb-4 font-semibold text-gray-900">
                      Últimas Transacciones
                    </h3>
                    {loading ? (
                      <div className="py-12 text-center">
                        <p className="text-gray-500">Cargando transacciones...</p>
                      </div>
                    ) : recentTransactions.length === 0 ? (
                      <div className="py-12 text-center">
                        <Wallet className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                        <p className="mb-2 font-medium text-gray-900">
                          No hay transacciones aún
                        </p>
                        <p className="text-sm text-gray-600">
                          Tus transacciones aparecerán aquí
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentTransactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`rounded-full p-2 ${
                                  transaction.amount >= 0
                                    ? "bg-green-100 text-green-600"
                                    : "bg-red-100 text-red-600"
                                }`}
                              >
                                {transaction.amount >= 0 ? (
                                  <ArrowDownLeft className="h-5 w-5" />
                                ) : (
                                  <ArrowUpRight className="h-5 w-5" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {transaction.description}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(transaction.date).toLocaleDateString('es-MX', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={`font-semibold ${
                                  transaction.amount >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {transaction.amount >= 0 ? "+" : ""}
                                {formatCurrency(Math.abs(transaction.amount), selectedCurrency)}
                              </p>
                              <Badge variant="secondary" className="text-xs">
                                {transaction.type}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* All Transactions */}
                <TabsContent value="all">
                  <div className="space-y-6">
                    <h3 className="font-semibold text-gray-900">
                      Historial Completo
                    </h3>
                    {loading ? (
                      <div className="py-12 text-center">
                        <p className="text-gray-500">Cargando transacciones...</p>
                      </div>
                    ) : transactions.length === 0 ? (
                      <div className="py-12 text-center">
                        <Wallet className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                        <p className="mb-2 font-medium text-gray-900">
                          No hay transacciones aún
                        </p>
                        <p className="text-sm text-gray-600">
                          Tus transacciones aparecerán aquí
                        </p>
                      </div>
                    ) : (
                      Object.entries(transactionsByMonth)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([monthKey, monthTransactions]) => (
                          <div key={monthKey}>
                            <h4 className="mb-3 text-sm font-medium text-gray-500">
                              {getMonthName(monthKey)}
                            </h4>
                            <div className="space-y-3">
                              {monthTransactions.map((transaction) => (
                                <div
                                  key={transaction.id}
                                  className="flex items-center justify-between rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
                                >
                                  <div className="flex items-center gap-4">
                                    <div
                                      className={`rounded-full p-2 ${
                                        transaction.amount >= 0
                                          ? "bg-green-100 text-green-600"
                                          : "bg-red-100 text-red-600"
                                      }`}
                                    >
                                      {transaction.amount >= 0 ? (
                                        <ArrowDownLeft className="h-5 w-5" />
                                      ) : (
                                        <ArrowUpRight className="h-5 w-5" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {transaction.description}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {new Date(transaction.date).toLocaleDateString('es-MX', {
                                          day: 'numeric',
                                          month: 'short',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p
                                      className={`font-semibold ${
                                        transaction.amount >= 0
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {transaction.amount >= 0 ? "+" : ""}
                                      {formatCurrency(Math.abs(transaction.amount), selectedCurrency)}
                                    </p>
                                    <Badge variant="secondary" className="text-xs">
                                      {transaction.type}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Right Column - Actions & Currency */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="mb-4 font-semibold text-gray-900">Acciones Rápidas</h3>
              <div className="space-y-3">
                <Button
                  className="w-full justify-start bg-gradient-to-r from-blue-600 to-indigo-600"
                  onClick={() => navigate("add-balance")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Saldo
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("profile")}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Ver Mi Perfil
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("events")}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Explorar Eventos
                </Button>
              </div>
            </Card>

            {/* Currency Selector */}
            <Card className="p-6">
              <h3 className="mb-4 font-semibold text-gray-900">Moneda de Visualización</h3>
              <CurrencySelector
                selectedCurrency={selectedCurrency}
                onCurrencyChange={handleCurrencyChange}
                showLabel={false}
              />
              <Separator className="my-4" />
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Tasas de Cambio</p>
                {(Object.keys(EXCHANGE_RATES[selectedCurrency]) as Currency[]).map((currency) => {
                  if (currency === selectedCurrency) return null;
                  const rate = EXCHANGE_RATES[selectedCurrency][currency];
                  return (
                    <div key={currency} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        1 {selectedCurrency} =
                      </span>
                      <span className="font-medium text-gray-900">
                        {rate.toFixed(4)} {currency}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Info Card */}
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-6">
              <div className="mb-3 flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <DollarSign className="h-5 w-5" />
                <h3 className="font-semibold dark:text-blue-200">Información</h3>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Tu saldo está protegido y disponible en todo momento para comprar tickets. 
                Agrega saldo cuando lo necesites y disfruta de eventos increíbles.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
