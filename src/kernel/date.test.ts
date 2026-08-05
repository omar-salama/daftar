import { describe, expect, it } from 'vitest';
import { addDays, daysInMonth, getBillingCycle } from './date';

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
    // start day = 16 (closing is 15th), date = 2026-07-10
    // belongs to June 16 -> July 15 cycle
    expect(getBillingCycle(16, '2026-07-10')).toEqual({
      startDate: '2026-06-16',
      endDate: '2026-07-15',
      paymentDate: undefined
    });
  });
  
  it('handles date exactly on closing date', () => {
    expect(getBillingCycle(16, '2026-07-15')).toEqual({
      startDate: '2026-06-16',
      endDate: '2026-07-15',
      paymentDate: undefined
    });
  });
  
  it('handles date after closing date', () => {
    expect(getBillingCycle(16, '2026-07-16')).toEqual({
      startDate: '2026-07-16',
      endDate: '2026-08-15',
      paymentDate: undefined
    });
  });
  
  it('handles year boundary transitions (January)', () => {
    expect(getBillingCycle(16, '2026-01-10')).toEqual({
      startDate: '2025-12-16',
      endDate: '2026-01-15',
      paymentDate: undefined
    });
  });
  
  it('handles year boundary transitions (December)', () => {
    expect(getBillingCycle(16, '2025-12-16')).toEqual({
      startDate: '2025-12-16',
      endDate: '2026-01-15',
      paymentDate: undefined
    });
  });
  
  it('handles start day 1 correctly', () => {
    // start day = 1, calendarDate = 2026-02-28
    expect(getBillingCycle(1, '2026-02-28')).toEqual({
      startDate: '2026-02-01',
      endDate: '2026-02-28',
      paymentDate: undefined
    });
    
    // date = 2026-03-01
    expect(getBillingCycle(1, '2026-03-01')).toEqual({
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      paymentDate: undefined
    });
  });

  it('calculates payment date correctly (next month)', () => {
    // cycle starts 16th, closes 15th
    expect(getBillingCycle(16, '2026-07-10', 10).paymentDate).toBe('2026-08-10');
  });
  
  it('clamps payment date to month length', () => {
    // cycle starts 16th, closes Jan 15. paymentDay 31.
    // 31 > 15, so same month (Jan). Jan has 31 days.
    expect(getBillingCycle(16, '2026-01-10', 31).paymentDate).toBe('2026-01-31');
    
    // cycle starts 16th, closes Feb 15. paymentDay 31.
    // 31 > 15, so same month (Feb). Feb clamps to 28/29.
    expect(getBillingCycle(16, '2026-02-10', 31).paymentDate).toBe('2026-02-28');
    expect(getBillingCycle(16, '2024-02-10', 31).paymentDate).toBe('2024-02-29');
  });
  
  it('handles year boundary for payment date', () => {
    // cycle starts 16th, closes Dec 15.
    expect(getBillingCycle(16, '2026-12-10', 10).paymentDate).toBe('2027-01-10');
  });
});
