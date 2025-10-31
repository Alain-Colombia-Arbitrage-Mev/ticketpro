// Sistema de Monedas Multi-Currency
// Soporta USD, MXN, BRL, EUR

export type Currency = 'USD' | 'MXN' | 'BRL' | 'EUR';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: Record<Currency, CurrencyInfo> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
  },
  MXN: {
    code: 'MXN',
    symbol: '$',
    name: 'Mexican Peso',
    locale: 'es-MX',
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Brazilian Real',
    locale: 'pt-BR',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'de-DE',
  },
};

// Tasas de cambio base (1 USD = ...)
// En producción, estas se obtendrían de una API como exchangerate-api.com
export const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  MXN: 17.50, // 1 USD = 17.50 MXN (aproximado)
  BRL: 5.00,  // 1 USD = 5.00 BRL (aproximado)
  EUR: 0.92,  // 1 USD = 0.92 EUR (aproximado)
};

/**
 * Convierte un monto de una moneda a otra
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Primero convertir a USD como moneda base
  const amountInUSD = amount / EXCHANGE_RATES[fromCurrency];
  
  // Luego convertir de USD a la moneda destino
  const convertedAmount = amountInUSD * EXCHANGE_RATES[toCurrency];
  
  // Redondear a 2 decimales
  return Math.round(convertedAmount * 100) / 100;
}

/**
 * Formatea un monto con el símbolo de la moneda
 */
export function formatCurrency(
  amount: number,
  currency: Currency,
  showCode: boolean = false
): string {
  const currencyInfo = CURRENCIES[currency];
  
  const formatted = new Intl.NumberFormat(currencyInfo.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if (showCode && currency !== 'USD') {
    return `${formatted} ${currency}`;
  }

  return formatted;
}

/**
 * Obtiene el símbolo de una moneda
 */
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCIES[currency].symbol;
}

/**
 * Obtiene el nombre completo de una moneda
 */
export function getCurrencyName(currency: Currency): string {
  return CURRENCIES[currency].name;
}

/**
 * Obtiene todas las monedas disponibles
 */
export function getAvailableCurrencies(): Currency[] {
  return Object.keys(CURRENCIES) as Currency[];
}

/**
 * Valida si una moneda es válida
 */
export function isValidCurrency(currency: string): currency is Currency {
  return currency in CURRENCIES;
}

/**
 * Obtiene la moneda por defecto del sistema
 */
export function getDefaultCurrency(): Currency {
  return 'USD';
}

/**
 * Formatea un objeto de balance multi-moneda
 */
export interface MultiCurrencyBalance {
  USD: number;
  MXN: number;
  BRL: number;
  EUR: number;
}

/**
 * Crea un balance vacío en todas las monedas
 */
export function createEmptyBalance(): MultiCurrencyBalance {
  return {
    USD: 0,
    MXN: 0,
    BRL: 0,
    EUR: 0,
  };
}

/**
 * Calcula el valor total del balance en una moneda específica
 */
export function getTotalBalanceIn(
  balance: MultiCurrencyBalance,
  targetCurrency: Currency
): number {
  let total = 0;
  
  for (const [currency, amount] of Object.entries(balance)) {
    if (isValidCurrency(currency)) {
      total += convertCurrency(amount, currency, targetCurrency);
    }
  }
  
  return Math.round(total * 100) / 100;
}

/**
 * Agrega un monto a un balance multi-moneda
 */
export function addToBalance(
  balance: MultiCurrencyBalance,
  amount: number,
  currency: Currency
): MultiCurrencyBalance {
  return {
    ...balance,
    [currency]: Math.round((balance[currency] + amount) * 100) / 100,
  };
}

/**
 * Deduce un monto de un balance multi-moneda
 */
export function deductFromBalance(
  balance: MultiCurrencyBalance,
  amount: number,
  currency: Currency
): MultiCurrencyBalance {
  return {
    ...balance,
    [currency]: Math.round((balance[currency] - amount) * 100) / 100,
  };
}

/**
 * Verifica si hay fondos suficientes en una moneda específica
 */
export function hasSufficientFunds(
  balance: MultiCurrencyBalance,
  amount: number,
  currency: Currency
): boolean {
  return balance[currency] >= amount;
}

/**
 * Obtiene el equivalente de un precio en múltiples monedas
 */
export function getPriceInAllCurrencies(
  amount: number,
  baseCurrency: Currency
): MultiCurrencyBalance {
  return {
    USD: convertCurrency(amount, baseCurrency, 'USD'),
    MXN: convertCurrency(amount, baseCurrency, 'MXN'),
    BRL: convertCurrency(amount, baseCurrency, 'BRL'),
    EUR: convertCurrency(amount, baseCurrency, 'EUR'),
  };
}
