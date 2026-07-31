import { describe, it, expect } from 'vitest';
import { daysInMonth, getClosingDate, getBillingCycle, getPaymentDate, addDays } from './date';

describe('daysInMonth', () => {
  it('handles 31-day months', () => {
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 3)).toBe(31);
    expect(daysInMonth(2026, 5)).toBe(31);
  });
  
  it('handles 30-day months', () => {
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 6)).toBe(30);
  });
  
  it('handles February in non-leap year', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
  });
  
  it('handles February in leap year', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
  });
});

describe('getClosingDate', () => {
  it('uses configured closing day if within month bounds', () => {
    expect(getClosingDate(2026, 7, 15)).toBe('2026-07-15');
  });
  
  it('clamps to max day of the month', () => {
    expect(getClosingDate(2026, 2, 31)).toBe('2026-02-28');
    expect(getClosingDate(2024, 2, 31)).toBe('2024-02-29');
    expect(getClosingDate(2026, 4, 31)).toBe('2026-04-30');
  });
});

describe('addDays', () => {
  it('adds days across month boundaries', () => {
    expect(addDays('2026-07-15', 20)).toBe('2026-08-04');
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
  });
});

describe('getBillingCycle', () => {
  it('handles date before closing date', () => {
    // calendarDate = 2026-07-10, closingDay = 15
    // belongs to June 16 -> July 15 cycle
    expect(getBillingCycle(15, '2026-07-10')).toEqual({
      periodStart: '2026-06-16',
      closingDate: '2026-07-15'
    });
  });
  
  it('handles date exactly on closing date', () => {
    expect(getBillingCycle(15, '2026-07-15')).toEqual({
      periodStart: '2026-06-16',
      closingDate: '2026-07-15'
    });
  });
  
  it('handles date after closing date', () => {
    expect(getBillingCycle(15, '2026-07-16')).toEqual({
      periodStart: '2026-07-16',
      closingDate: '2026-08-15'
    });
  });
  
  it('handles year boundary transitions (January)', () => {
    expect(getBillingCycle(15, '2026-01-10')).toEqual({
      periodStart: '2025-12-16',
      closingDate: '2026-01-15'
    });
  });
  
  it('handles year boundary transitions (December)', () => {
    expect(getBillingCycle(15, '2025-12-16')).toEqual({
      periodStart: '2025-12-16',
      closingDate: '2026-01-15'
    });
  });
  
  it('handles month clamping properly', () => {
    // closingDay = 31, calendarDate = 2026-02-28
    expect(getBillingCycle(31, '2026-02-28')).toEqual({
      periodStart: '2026-02-01',
      closingDate: '2026-02-28'
    });
    
    // date = 2026-03-01
    expect(getBillingCycle(31, '2026-03-01')).toEqual({
      periodStart: '2026-03-01',
      closingDate: '2026-03-31'
    });
  });
});

describe('getPaymentDate', () => {
  it('calculates fixed_day correctly (next month)', () => {
    expect(getPaymentDate('2026-07-15', 10)).toBe('2026-08-10');
  });
  
  it('clamps fixed_day to month length', () => {
    expect(getPaymentDate('2026-01-15', 31)).toBe('2026-02-28');
    expect(getPaymentDate('2024-01-15', 31)).toBe('2024-02-29');
  });
  
  it('handles year boundary for fixed_day', () => {
    expect(getPaymentDate('2026-12-15', 10)).toBe('2027-01-10');
  });
});
