import { describe, expect, it } from 'vitest';
import { Minor } from '@/kernel/money';
import { computeMainCurrencyLines, proportionLinesForInstallment } from './lineProcessing';

describe('lineProcessing', () => {
  describe('computeMainCurrencyLines', () => {
    it('passes through amountMinor when no exchange rate', () => {
      const lines = [
        { categoryId: 'food', amountMinor: 1000 as Minor },
        { categoryId: 'rent', amountMinor: 5000 as Minor },
      ];
      const result = computeMainCurrencyLines(lines);
      expect(result[0].mainCurrencyAmountMinor).toBe(1000);
      expect(result[1].mainCurrencyAmountMinor).toBe(5000);
    });

    it('multiplies by exchange rate when provided', () => {
      const lines = [{ categoryId: 'food', amountMinor: 1000 as Minor }];
      const result = computeMainCurrencyLines(lines, 2.5);
      expect(result[0].mainCurrencyAmountMinor).toBe(2500);
    });

    it('rounds to nearest integer', () => {
      const lines = [{ categoryId: 'food', amountMinor: 333 as Minor }];
      const result = computeMainCurrencyLines(lines, 1.5);
      // 333 * 1.5 = 499.5 → rounds to 500
      expect(result[0].mainCurrencyAmountMinor).toBe(500);
    });

    it('preserves other line properties', () => {
      const lines = [{ categoryId: 'food', amountMinor: 1000 as Minor }];
      const result = computeMainCurrencyLines(lines);
      expect(result[0].categoryId).toBe('food');
      expect(result[0].amountMinor).toBe(1000);
    });
  });

  describe('proportionLinesForInstallment', () => {
    it('replaces full-amount line with installment amount', () => {
      const lines = [{ categoryId: 'food', amountMinor: 12000 as Minor }];
      const result = proportionLinesForInstallment(lines, 12000 as Minor, 1000 as Minor);
      expect(result[0].amountMinor).toBe(1000);
    });

    it('proportions split lines by ratio', () => {
      const lines = [
        { categoryId: 'food', amountMinor: 6000 as Minor },
        { categoryId: 'rent', amountMinor: 6000 as Minor },
      ];
      const total = 12000 as Minor;
      const installment = 1000 as Minor;
      const result = proportionLinesForInstallment(lines, total, installment);
      // Each is 50% of total, so each gets 500
      expect(result[0].amountMinor).toBe(500);
      expect(result[1].amountMinor).toBe(500);
    });

    it('applies exchange rate to main currency amounts', () => {
      const lines = [{ categoryId: 'food', amountMinor: 12000 as Minor }];
      const result = proportionLinesForInstallment(lines, 12000 as Minor, 1000 as Minor, 2.0);
      expect(result[0].amountMinor).toBe(1000);
      expect(result[0].mainCurrencyAmountMinor).toBe(2000);
    });

    it('passes through amountMinor as mainCurrencyAmountMinor when no exchange rate', () => {
      const lines = [{ categoryId: 'food', amountMinor: 12000 as Minor }];
      const result = proportionLinesForInstallment(lines, 12000 as Minor, 1000 as Minor);
      expect(result[0].mainCurrencyAmountMinor).toBe(1000);
    });
  });
});
