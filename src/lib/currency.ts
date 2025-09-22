export type CurrencyCode = 'GBP' | 'USD';

const CURRENCY_LOCALE_MAP: Record<CurrencyCode, string> = {
  GBP: 'en-GB',
  USD: 'en-US'
};

export function formatCurrency(amount: number, currency: CurrencyCode, locale?: string): string {
  try {
    // Use provided locale or default to currency-specific locale
    const formatLocale = locale || CURRENCY_LOCALE_MAP[currency];
    return new Intl.NumberFormat(formatLocale, { 
      style: 'currency', 
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    // Fallback to en-GB GBP formatting if Intl fails
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
  }
}


