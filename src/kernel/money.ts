export type Minor = number & { __brand: 'minor' };

export interface CurrencyConfig {
  symbol: string;
  decimals: number;
}

export function minorFromDigits(digits: string): Minor {
  if (!/^\d*$/.test(digits)) {
    throw new Error('minorFromDigits: Input must contain only digits');
  }
  
  if (digits === '') {
    return 0 as Minor;
  }

  const value = parseInt(digits, 10);
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
