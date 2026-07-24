export type Minor = number & { __brand: 'minor' };

export interface CurrencyConfig {
  symbol: string;
  decimals: number;
}

export function minorFromDigits(digits: string): Minor {
  if (digits === '' || digits === '.') {
    return 0 as Minor;
  }

  if (!/^\d*(\.\d{0,2})?$/.test(digits)) {
    throw new Error('minorFromDigits: Input must be a valid amount');
  }

  const [wholeStr = '0', decimalStr = ''] = digits.split('.');
  const whole = parseInt(wholeStr || '0', 10);
  const decimal = parseInt(decimalStr.padEnd(2, '0'), 10);

  const value = whole * 100 + decimal;
  if (!Number.isSafeInteger(value)) {
    throw new Error('minorFromDigits: Unsafe integer');
  }

  return value as Minor;
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
