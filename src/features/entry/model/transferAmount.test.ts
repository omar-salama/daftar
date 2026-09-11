import { describe, expect, it } from 'vitest';
import { Minor } from '@/kernel/money';
import { resolveTransferAmount } from './transferAmount';

describe('resolveTransferAmount', () => {
  it('returns same amount and rate=1 for same-currency transfers', () => {
    const result = resolveTransferAmount(1000 as Minor, '', false);
    expect(result.transferAmountMinor).toBe(1000);
    expect(result.transferExchangeRate).toBe(1);
  });

  it('parses transfer digits for cross-currency transfers', () => {
    const result = resolveTransferAmount(1000 as Minor, '20', true);
    expect(result.transferAmountMinor).toBe(2000); // 20.00 = 2000 minor
    expect(result.transferExchangeRate).toBe(2); // 2000 / 1000
  });

  it('computes correct rate for fractional cross-currency', () => {
    const result = resolveTransferAmount(10000 as Minor, '150.50', true);
    expect(result.transferAmountMinor).toBe(15050);
    expect(result.transferExchangeRate).toBeCloseTo(1.505);
  });
});
