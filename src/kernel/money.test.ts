import { describe, expect, it } from 'vitest';
import { addMinor, formatMinor, Minor, minorFromDigits, negateMinor } from './money';

describe('money kernel', () => {
  describe('minorFromDigits', () => {
    it('converts valid digit strings to Minor', () => {
      expect(minorFromDigits('10')).toBe(1000);
      expect(minorFromDigits('12.34')).toBe(1234);
      expect(minorFromDigits('0.5')).toBe(50);
      expect(minorFromDigits('0')).toBe(0);
      expect(minorFromDigits('')).toBe(0);
      expect(minorFromDigits('-')).toBe(0);
      expect(minorFromDigits('-10')).toBe(-1000);
      expect(minorFromDigits('-12.34')).toBe(-1234);
      expect(minorFromDigits('-0.5')).toBe(-50);
    });

    it('throws on invalid float inputs', () => {
      expect(() => minorFromDigits('12.345')).toThrow(/amount/);
      expect(() => minorFromDigits('1,23')).toThrow(/amount/);
    });

    it('throws on non-numeric inputs', () => {
      expect(() => minorFromDigits('abc')).toThrow(/amount/);
      expect(() => minorFromDigits('12a3')).toThrow(/amount/);
    });
  });

  describe('addMinor', () => {
    it('adds two minor values correctly', () => {
      expect(addMinor(100 as Minor, 50 as Minor)).toBe(150);
      expect(addMinor(-100 as Minor, 50 as Minor)).toBe(-50);
    });

    it('asserts safe integers', () => {
      expect(() => addMinor(Number.MAX_SAFE_INTEGER as Minor, 1 as Minor)).toThrow(/safe integer/);
    });
  });

  describe('negateMinor', () => {
    it('negates a minor value correctly', () => {
      expect(negateMinor(100 as Minor)).toBe(-100);
      expect(negateMinor(-50 as Minor)).toBe(50);
    });
  });

  describe('formatMinor', () => {
    it('formats using decimals exactly', () => {
      expect(formatMinor(1234 as Minor, { symbol: '$', decimals: 2 })).toBe('$12.34');
      expect(formatMinor(10 as Minor, { symbol: '£', decimals: 2 })).toBe('£0.10');
      expect(formatMinor(500 as Minor, { symbol: '¥', decimals: 0 })).toBe('¥500');
    });
  });
});
