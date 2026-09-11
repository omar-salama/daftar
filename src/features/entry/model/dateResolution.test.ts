import { describe, expect, it } from 'vitest';
import { resolveInstallmentDate } from './dateResolution';

describe('resolveInstallmentDate', () => {
  it('returns original date when account has no billing cycle', () => {
    const accounts = [{ accountId: 'a1' }];
    expect(resolveInstallmentDate('2026-07-10', 'a1', accounts)).toBe('2026-07-10');
  });

  it('returns original date when account is not found', () => {
    const accounts = [{ accountId: 'a1', billingCycleStartDay: 16, paymentDay: 10 }];
    expect(resolveInstallmentDate('2026-07-10', 'a2', accounts)).toBe('2026-07-10');
  });

  it('returns payment date from billing cycle for credit-card accounts', () => {
    const accounts = [
      { accountId: 'a1', billingCycleStartDay: 16, paymentDay: 10 },
    ];
    // For cycle start 16, date 2026-07-10 falls in Jun 16 - Jul 15 cycle
    // Payment day 10 → payment in Aug
    expect(resolveInstallmentDate('2026-07-10', 'a1', accounts)).toBe('2026-08-10');
  });

  it('returns original date when only billingCycleStartDay is set (no paymentDay)', () => {
    const accounts = [{ accountId: 'a1', billingCycleStartDay: 16 }];
    expect(resolveInstallmentDate('2026-07-10', 'a1', accounts)).toBe('2026-07-10');
  });
});
