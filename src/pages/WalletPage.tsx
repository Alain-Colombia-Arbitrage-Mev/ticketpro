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
    <div className="min-h-screen bg-black pb-12">
      {/* Header */}
      <div className="border-b border-white/20 bg-black sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("home")}
                className="rounded-lg !text-white hover:!bg-white/10"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold !text-white">{t('wallet.title')}</h1>
                <p className="text-sm !text-white/70">{t('wallet.info_desc')}</p>
              </div>
            </div>
            <Button
              className="bg-[#c61619] hover:bg-[#a01316] text-white shadow-lg hover:shadow-xl transition-all"
              onClick={() => navigate("add-balance")}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('wallet.add_balance')}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Balance & Stats */}
          <div className="space-y-6 lg:col-span-2">
            {/* Main Balance Card */}
            <Card className="overflow-hidden !bg-black border-white/20">
              <div className="bg-gradient-to-br from-[#c61619] via-[#a01316] to-[#8a0f12] p-8 text-white">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/90">{t('wallet.total_balance')}</p>
                      <p className="text-xs text-white/70">Balance disponible</p>
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
                  <div className="mb-2 text-4xl md:text-5xl font-bold tracking-tight">
                    {formatCurrency(user.balance, selectedCurrency)}
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">
                      En {CURRENCIES[selectedCurrency].name}
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm border border-white/20">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="rounded-full bg-green-400/30 p-1.5">
                        <ArrowDownLeft className="h-4 w-4 text-green-300" />
                      </div>
                      <span className="text-sm text-white/90 font-medium">Ingresos</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(income, selectedCurrency)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm border border-white/20">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="rounded-full bg-red-400/30 p-1.5">
                        <ArrowUpRight className="h-4 w-4 text-red-300" />
                      </div>
                      <span className="text-sm text-white/90 font-medium">Gastos</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(expenses, selectedCurrency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Multi-Currency Display */}
              <div className="p-6 !bg-black">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold !text-white">{t('wallet.multi_currency')}</h3>
                </div>
                <MultiCurrencyBalance
                  balance={user.balance}
                  selectedCurrency={selectedCurrency}
                  showAllCurrencies={true}
                />
              </div>
            </Card>

            {/* Transactions */}
            <Card className="p-6 !bg-black border-white/20">
              <Tabs defaultValue="recent" className="w-full">
                <TabsList className="mb-6 grid w-full grid-cols-2 !bg-black/50 border border-white/20">
                  <TabsTrigger value="recent" className="!text-white data-[state=active]:!bg-[#c61619] data-[state=active]:!text-white">Recientes</TabsTrigger>
                  <TabsTrigger value="all" className="!text-white data-[state=active]:!bg-[#c61619] data-[state=active]:!text-white">Todas</TabsTrigger>
                </TabsList>

                {/* Recent Transactions */}
                <TabsContent value="recent">
                  <div className="space-y-1">
                    <h3 className="mb-4 font-semibold !text-white">
                      {t('wallet.recent_transactions')}
                    </h3>
                    {loading ? (
                      <div className="py-12 text-center">
                        <p className="!text-white/70">Cargando transacciones...</p>
                      </div>
                    ) : recentTransactions.length === 0 ? (
                      <div className="py-12 text-center">
                        <Wallet className="mx-auto mb-4 h-12 w-12 !text-white/40" />
                        <p className="mb-2 font-medium !text-white">
                          No hay transacciones aún
                        </p>
                        <p className="text-sm !text-white/70">
                          Tus transacciones aparecerán aquí
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentTransactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between rounded-lg border border-white/20 bg-white/5 p-4 transition-colors hover:bg-white/10 hover:border-white/30"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`rounded-full p-2.5 ${
                                  transaction.amount >= 0
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                                }`}
                              >
                                {transaction.amount >= 0 ? (
                                  <ArrowDownLeft className="h-5 w-5" />
                                ) : (
                                  <ArrowUpRight className="h-5 w-5" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium !text-white">
                                  {transaction.description}
                                </p>
                                <p className="text-sm !text-white/60">
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
                                className={`font-semibold text-lg ${
                                  transaction.amount >= 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                {transaction.amount >= 0 ? "+" : ""}
                                {formatCurrency(Math.abs(transaction.amount), selectedCurrency)}
                              </p>
                              <Badge variant="secondary" className="text-xs !bg-white/10 !text-white border-white/20 mt-1">
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
                    <h3 className="font-semibold !text-white">
                      Historial Completo
                    </h3>
                    {loading ? (
                      <div className="py-12 text-center">
                        <p className="!text-white/70">Cargando transacciones...</p>
                      </div>
                    ) : transactions.length === 0 ? (
                      <div className="py-12 text-center">
                        <Wallet className="mx-auto mb-4 h-12 w-12 !text-white/40" />
                        <p className="mb-2 font-medium !text-white">
                          No hay transacciones aún
                        </p>
                        <p className="text-sm !text-white/70">
                          Tus transacciones aparecerán aquí
                        </p>
                      </div>
                    ) : (
                      Object.entries(transactionsByMonth)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([monthKey, monthTransactions]) => (
                          <div key={monthKey}>
                            <h4 className="mb-3 text-sm font-medium !text-white/70 border-b border-white/20 pb-2">
                              {getMonthName(monthKey)}
                            </h4>
                            <div className="space-y-3 mt-3">
                              {monthTransactions.map((transaction) => (
                                <div
                                  key={transaction.id}
                                  className="flex items-center justify-between rounded-lg border border-white/20 bg-white/5 p-4 transition-colors hover:bg-white/10 hover:border-white/30"
                                >
                                  <div className="flex items-center gap-4">
                                    <div
                                      className={`rounded-full p-2.5 ${
                                        transaction.amount >= 0
                                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                                      }`}
                                    >
                                      {transaction.amount >= 0 ? (
                                        <ArrowDownLeft className="h-5 w-5" />
                                      ) : (
                                        <ArrowUpRight className="h-5 w-5" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium !text-white">
                                        {transaction.description}
                                      </p>
                                      <p className="text-sm !text-white/60">
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
                                      className={`font-semibold text-lg ${
                                        transaction.amount >= 0
                                          ? "text-green-400"
                                          : "text-red-400"
                                      }`}
                                    >
                                      {transaction.amount >= 0 ? "+" : ""}
                                      {formatCurrency(Math.abs(transaction.amount), selectedCurrency)}
                                    </p>
                                    <Badge variant="secondary" className="text-xs !bg-white/10 !text-white border-white/20 mt-1">
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
            <Card className="p-6 !bg-black border-white/20">
              <h3 className="mb-4 font-semibold !text-white">Acciones Rápidas</h3>
              <div className="space-y-3">
                <Button
                  className="w-full justify-start bg-[#c61619] hover:bg-[#a01316] text-white"
                  onClick={() => navigate("add-balance")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('wallet.add_balance')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-white/20 !text-white hover:!bg-white/10"
                  onClick={() => navigate("profile")}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Ver Mi Perfil
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-white/20 !text-white hover:!bg-white/10"
                  onClick={() => navigate("events")}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Explorar Eventos
                </Button>
              </div>
            </Card>

            {/* Currency Selector */}
            <Card className="p-6 !bg-black border-white/20">
              <h3 className="mb-4 font-semibold !text-white">Moneda de Visualización</h3>
              <CurrencySelector
                selectedCurrency={selectedCurrency}
                onCurrencyChange={handleCurrencyChange}
                showLabel={false}
              />
              <Separator className="my-4 bg-white/20" />
              <div className="space-y-2">
                <p className="text-sm !text-white/70">Tasas de Cambio</p>
                {(Object.keys(EXCHANGE_RATES[selectedCurrency]) as Currency[]).map((currency) => {
                  if (currency === selectedCurrency) return null;
                  const rate = EXCHANGE_RATES[selectedCurrency][currency];
                  return (
                    <div key={currency} className="flex justify-between text-sm">
                      <span className="!text-white/70">
                        1 {selectedCurrency} =
                      </span>
                      <span className="font-medium !text-white">
                        {rate.toFixed(4)} {currency}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Info Card */}
            <Card className="border-[#c61619]/30 bg-[#c61619]/10 p-6">
              <div className="mb-3 flex items-center gap-2 !text-[#c61619]">
                <DollarSign className="h-5 w-5" />
                <h3 className="font-semibold !text-white">{t('wallet.info')}</h3>
              </div>
              <p className="text-sm !text-white/90">
                {t('wallet.info_desc')}
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
