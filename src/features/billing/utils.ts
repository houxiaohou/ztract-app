export function formatCurrency(
  minorUnits: number,
  currency: string,
  locale?: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(minorUnits / 100);
}

export function preferredCurrency(
  prices: Record<string, number>,
  language: string,
): string {
  const upperKeys = Object.keys(prices);
  if (upperKeys.length === 0) return 'USD';

  const prefer = language.toLowerCase().startsWith('zh') ? 'CNY' : 'USD';
  if (prefer in prices) return prefer;
  if ('USD' in prices) return 'USD';
  return upperKeys[0];
}

export function intlLocale(language: string): string | undefined {
  if (!language) return undefined;
  if (language.toLowerCase().startsWith('zh')) return 'zh-CN';
  return language;
}
