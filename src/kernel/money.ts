export type Minor = number & { __brand: 'minor' };

export interface CurrencyConfig {
  symbol: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { symbol: '$', decimals: 2 },
  EUR: { symbol: '€', decimals: 2 },
  GBP: { symbol: '£', decimals: 2 },
  JPY: { symbol: '¥', decimals: 0 },
  EGP: { symbol: 'E£', decimals: 2 },
  CAD: { symbol: 'C$', decimals: 2 },
  AUD: { symbol: 'A$', decimals: 2 },
};

// Default base currency config used throughout the app for totals.
export const DEFAULT_CURRENCY: CurrencyConfig = SUPPORTED_CURRENCIES['EGP'];
export function minorFromDigits(digits: string): Minor {
  if (digits === '' || digits === '.' || digits === '-') {
    return 0 as Minor;
  }

  if (!/^-?\d*(\.\d{0,2})?$/.test(digits)) {
    throw new Error('minorFromDigits: Input must be a valid amount');
  }

  const isNegative = digits.startsWith('-');
  const absDigits = isNegative ? digits.slice(1) : digits;

  const [wholeStr = '0', decimalStr = ''] = absDigits.split('.');
  const whole = parseInt(wholeStr || '0', 10);
  const decimal = parseInt(decimalStr.padEnd(2, '0'), 10);

  const absoluteValue = whole * 100 + decimal;
  const value = isNegative ? -absoluteValue : absoluteValue;
  if (!Number.isSafeInteger(value)) {
    throw new Error('minorFromDigits: Unsafe integer');
  }

  return value as Minor;
}

export function appendDigit(currentDigits: string, digit: string): string {
  if (digit === '.') {
    if (!currentDigits.includes('.')) {
      return currentDigits === '' ? '0.' : currentDigits + '.';
    }
    return currentDigits;
  }

  if (currentDigits.includes('.')) {
    const parts = currentDigits.split('.');
    if (parts[1] && parts[1].length >= 2) return currentDigits;
  }

  if (currentDigits.length < 10) {
    return currentDigits + digit;
  }

  return currentDigits;
}

export function addMinor(a: Minor, b: Minor): Minor {
  const result = a + b;
  if (!Number.isSafeInteger(result)) {
    throw new Error('addMinor: Result is not a safe integer');
  }
  return result as Minor;
}

export function negateMinor(a: Minor): Minor {
  const result = -a;
  if (!Number.isSafeInteger(result)) {
    throw new Error('negateMinor: Result is not a safe integer');
  }
  return result as Minor;
}

export function formatMinor(m: Minor, config: CurrencyConfig): string {
  const divisor = Math.pow(10, config.decimals);
  const value = m / divisor;
  
  return `${config.symbol}${value.toFixed(config.decimals)}`;
}
