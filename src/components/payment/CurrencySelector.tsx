import { Check, ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Currency, CURRENCIES, getCurrencySymbol } from "../../utils/currency";

interface CurrencySelectorProps {
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  showLabel?: boolean;
  disabled?: boolean;
}

// Currency flags/icons
const CURRENCY_FLAGS: Record<Currency, string> = {
  USD: '🇺🇸',
  MXN: '🇲🇽',
  BRL: '🇧🇷',
  EUR: '🇪🇺',
};

export function CurrencySelector({
  selectedCurrency,
  onCurrencyChange,
  showLabel = true,
  disabled = false,
}: CurrencySelectorProps) {
  const currencies: Currency[] = ['USD', 'MXN', 'BRL', 'EUR'];
  const currentCurrency = CURRENCIES[selectedCurrency];

  return (
    <div className="w-full">
      {showLabel && (
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Moneda Preferida
        </label>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="w-full justify-between gap-2 h-11 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{CURRENCY_FLAGS[selectedCurrency]}</span>
              <span className="text-xl">{currentCurrency.symbol}</span>
              <div className="text-left">
                <div className="font-semibold">{selectedCurrency}</div>
                <div className="text-xs text-muted-foreground">{currentCurrency.name}</div>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[240px] dark:bg-gray-800 dark:border-gray-700">
          <DropdownMenuLabel className="dark:text-gray-300">Seleccionar Moneda</DropdownMenuLabel>
          <DropdownMenuSeparator className="dark:bg-gray-700" />
          {currencies.map((currency) => {
            const info = CURRENCIES[currency];
            const isSelected = selectedCurrency === currency;
            return (
              <DropdownMenuItem
                key={currency}
                onClick={() => onCurrencyChange(currency)}
                className={`flex items-center justify-between cursor-pointer py-3 ${
                  isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isSelected 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <span className="text-2xl">{CURRENCY_FLAGS[currency]}</span>
                  </div>
                  <div>
                    <div className={`flex items-center gap-2 ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'dark:text-gray-300'}`}>
                      <span className="font-semibold">{currency}</span>
                      <span className="text-lg">{info.symbol}</span>
                    </div>
                    <div className="text-xs text-muted-foreground dark:text-gray-400">{info.name}</div>
                  </div>
                </div>
                {isSelected && (
                  <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 font-bold" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
