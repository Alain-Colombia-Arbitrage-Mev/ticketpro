import { Wallet, TrendingUp, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Currency,
  MultiCurrencyBalance as BalanceType,
  formatCurrency,
  getTotalBalanceIn,
  convertCurrency,
} from "../utils/currency";

interface MultiCurrencyBalanceProps {
  balance: BalanceType | number; // Support both old and new format
  selectedCurrency: Currency;
  showAllCurrencies?: boolean;
}

export function MultiCurrencyBalance({
  balance,
  selectedCurrency,
  showAllCurrencies = true,
}: MultiCurrencyBalanceProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Convert old format to new if needed
  const multiBalance: BalanceType =
    typeof balance === "number"
      ? {
          USD: 0,
          MXN: balance, // Old balance was in MXN
          BRL: 0,
          EUR: 0,
        }
      : balance;

  // Get current balance in selected currency
  const currentBalance = multiBalance[selectedCurrency];

  // Get total balance in selected currency
  const totalBalance = getTotalBalanceIn(multiBalance, selectedCurrency);

  // Check if user has balance in multiple currencies
  const hasMultipleCurrencies =
    Object.values(multiBalance).filter((amount) => amount > 0).length > 1;

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 dark:from-blue-900/20 to-indigo-50 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
      <div className="space-y-4">
        {/* Main Balance */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Wallet className="h-4 w-4" />
              <span>Saldo Disponible</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(currentBalance, selectedCurrency)}
            </div>
            <Badge variant="outline" className="text-xs">
              {selectedCurrency}
            </Badge>
          </div>

          {showAllCurrencies && hasMultipleCurrencies && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="gap-2"
            >
              {showDetails ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Ocultar
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Ver todo
                </>
              )}
            </Button>
          )}
        </div>

        {/* Total in Selected Currency (if different) */}
        {hasMultipleCurrencies && totalBalance !== currentBalance && (
          <div className="pt-4 border-t border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <TrendingUp className="h-4 w-4" />
                <span>Total equivalente en {selectedCurrency}</span>
              </div>
              <div className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                {formatCurrency(totalBalance, selectedCurrency)}
              </div>
            </div>
          </div>
        )}

        {/* All Currencies Breakdown */}
        {showAllCurrencies && showDetails && (
          <div className="pt-4 border-t border-blue-200 dark:border-blue-800 space-y-3">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Desglose por moneda:
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(multiBalance) as [Currency, number][]).map(
                ([currency, amount]) => {
                  const isSelected = currency === selectedCurrency;
                  return (
                    <div
                      key={currency}
                      className={`p-3 rounded-lg ${
                        isSelected
                          ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"
                          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {currency}
                      </div>
                      <div
                        className={`text-lg font-semibold ${
                          isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {formatCurrency(amount, currency)}
                      </div>
                      {!isSelected && amount > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          ≈{" "}
                          {formatCurrency(
                            convertCurrency(amount, currency, selectedCurrency),
                            selectedCurrency
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* Single Currency Message */}
        {!hasMultipleCurrencies && multiBalance[selectedCurrency] === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center pt-2">
            Agrega saldo para comenzar a comprar tickets
          </div>
        )}
      </div>
    </Card>
  );
}
