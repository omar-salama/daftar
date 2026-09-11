import { describe, expect, it } from 'vitest';
import { Minor } from './money';
import { RowId, TxId } from './tx';
import {
  buildRecurrenceRule,
  divideInstallments,
  materializationTxId,
  pendingMaterializationDates,
  resolveCurrentRules,
  type RecurrenceId,
  type RecurrenceRule,
} from './recurrence';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRule(overrides: Partial<RecurrenceRule> = {}): RecurrenceRule {
  return buildRecurrenceRule({
    rowId: 'row-1' as RowId,
    recurrenceId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' as RecurrenceId,
    deviceId: 'deviceA',
    mode: 'recurring',
    accountId: 'acc-1',
    lines: [{ categoryId: 'cat-1', amountMinor: 5000 as Minor }],
    dayOfMonth: 1,
    startDate: '2026-01-01',
    ...overrides,
  }, 'v1');
}

// ---------------------------------------------------------------------------
// divideInstallments
// ---------------------------------------------------------------------------

describe('divideInstallments', () => {
  it('divides evenly', () => {
    const result = divideInstallments(10000 as Minor, 2);
    expect(result).toEqual([5000, 5000]);
  });

  it('distributes remainder to first installments (largest-remainder)', () => {
    const result = divideInstallments(10000 as Minor, 3);
    expect(result).toEqual([3334, 3333, 3333]);
    expect(result.reduce((a, b) => a + b, 0)).toBe(10000);
  });

  it('handles single installment', () => {
    const result = divideInstallments(7777 as Minor, 1);
    expect(result).toEqual([7777]);
  });

  it('handles large remainder', () => {
    const result = divideInstallments(10 as Minor, 3);
    expect(result).toEqual([4, 3, 3]);
    expect(result.reduce((a, b) => a + b, 0)).toBe(10);
  });

  it('handles zero total', () => {
    const result = divideInstallments(0 as Minor, 3);
    expect(result).toEqual([0, 0, 0]);
    expect(result.reduce((a, b) => a + b, 0)).toBe(0);
  });

  it('sum always equals original for arbitrary inputs', () => {
    const cases: [Minor, number][] = [
      [99999 as Minor, 7],
      [1 as Minor, 3],
      [100 as Minor, 100],
      [600000 as Minor, 12],
    ];
    for (const [total, count] of cases) {
      const result = divideInstallments(total, count);
      expect(result.length).toBe(count);
      expect(result.reduce((a, b) => a + b, 0)).toBe(total);
    }
  });

  it('throws on count <= 0', () => {
    expect(() => divideInstallments(100 as Minor, 0)).toThrow(/positive/);
    expect(() => divideInstallments(100 as Minor, -1)).toThrow(/positive/);
  });

  it('throws on unsafe integer', () => {
    expect(() => divideInstallments(12.34 as unknown as Minor, 2)).toThrow(/safe integer/);
  });
});

// ---------------------------------------------------------------------------
// buildRecurrenceRule
// ---------------------------------------------------------------------------

describe('buildRecurrenceRule', () => {
  it('computes totalMinor from lines', () => {
    const rule = buildRecurrenceRule({
      rowId: 'r1' as RowId,
      recurrenceId: 'rec1' as RecurrenceId,
      deviceId: 'A',
      mode: 'recurring',
      accountId: 'acc1',
      lines: [
        { categoryId: 'cat1', amountMinor: 100 as Minor },
        { categoryId: 'cat2', amountMinor: 50 as Minor },
      ],
      dayOfMonth: 15,
      startDate: '2026-01-15',
    }, 'v1');
    expect(rule.totalMinor).toBe(150);
  });

  it('defaults type to expense, materializedCount to 0, isActive to true', () => {
    const rule = makeRule();
    expect(rule.type).toBe('expense');
    expect(rule.materializedCount).toBe(0);
    expect(rule.isActive).toBe(true);
  });

  it('throws if dayOfMonth < 1 or > 28', () => {
    expect(() => makeRule({ dayOfMonth: 0 } as Partial<RecurrenceRule>)).toThrow(/dayOfMonth/);
    expect(() => makeRule({ dayOfMonth: 29 } as Partial<RecurrenceRule>)).toThrow(/dayOfMonth/);
    expect(() => makeRule({ dayOfMonth: 31 } as Partial<RecurrenceRule>)).toThrow(/dayOfMonth/);
  });

  it('throws if installment mode without totalInstallments', () => {
    expect(() => buildRecurrenceRule({
      rowId: 'r1' as RowId,
      recurrenceId: 'rec1' as RecurrenceId,
      deviceId: 'A',
      mode: 'installment',
      accountId: 'acc1',
      lines: [{ categoryId: 'cat1', amountMinor: 100 as Minor }],
      dayOfMonth: 1,
      startDate: '2026-01-01',
      originalTotalMinor: 1200 as Minor,
      // missing totalInstallments
    }, 'v1')).toThrow(/totalInstallments/);
  });

  it('throws if installment mode without originalTotalMinor', () => {
    expect(() => buildRecurrenceRule({
      rowId: 'r1' as RowId,
      recurrenceId: 'rec1' as RecurrenceId,
      deviceId: 'A',
      mode: 'installment',
      accountId: 'acc1',
      lines: [{ categoryId: 'cat1', amountMinor: 100 as Minor }],
      dayOfMonth: 1,
      startDate: '2026-01-01',
      totalInstallments: 12,
      // missing originalTotalMinor
    }, 'v1')).toThrow(/originalTotalMinor/);
  });

  it('throws if lines are empty and not deleted', () => {
    expect(() => buildRecurrenceRule({
      rowId: 'r1' as RowId,
      recurrenceId: 'rec1' as RecurrenceId,
      deviceId: 'A',
      mode: 'recurring',
      accountId: 'acc1',
      lines: [],
      dayOfMonth: 1,
      startDate: '2026-01-01',
    }, 'v1')).toThrow(/at least one line/);
  });

  it('allows empty lines if isDeleted', () => {
    const rule = buildRecurrenceRule({
      rowId: 'r1' as RowId,
      recurrenceId: 'rec1' as RecurrenceId,
      deviceId: 'A',
      mode: 'recurring',
      isDeleted: true,
      accountId: 'acc1',
      lines: [],
      dayOfMonth: 1,
      startDate: '2026-01-01',
    }, 'v1');
    expect(rule.isDeleted).toBe(true);
  });

  it('throws on unsafe integer in line amounts', () => {
    expect(() => buildRecurrenceRule({
      rowId: 'r1' as RowId,
      recurrenceId: 'rec1' as RecurrenceId,
      deviceId: 'A',
      mode: 'recurring',
      accountId: 'acc1',
      lines: [{ categoryId: 'cat1', amountMinor: 12.34 as unknown as Minor }],
      dayOfMonth: 1,
      startDate: '2026-01-01',
    }, 'v1')).toThrow(/Unsafe integer/);
  });
});

// ---------------------------------------------------------------------------
// resolveCurrentRules
// ---------------------------------------------------------------------------

describe('resolveCurrentRules', () => {
  it('picks latest version per recurrenceId', () => {
    const recId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' as RecurrenceId;
    const r1v1 = buildRecurrenceRule({
      rowId: 'row-1' as RowId,
      recurrenceId: recId,
      deviceId: 'A',
      mode: 'recurring',
      accountId: 'acc-1',
      lines: [{ categoryId: 'cat-1', amountMinor: 5000 as Minor }],
      dayOfMonth: 1,
      startDate: '2026-01-01',
    }, '0000100-0000-A');

    const r1v2 = buildRecurrenceRule({
      rowId: 'row-2' as RowId,
      recurrenceId: recId,
      deviceId: 'A',
      mode: 'recurring',
      accountId: 'acc-1',
      lines: [{ categoryId: 'cat-1', amountMinor: 9999 as Minor }],
      dayOfMonth: 1,
      startDate: '2026-01-01',
    }, '0000200-0000-A');

    const result = resolveCurrentRules([r1v1, r1v2]);
    expect(result.length).toBe(1);
    expect(result[0].version).toBe('0000200-0000-A');
    expect(result[0].totalMinor).toBe(9999);
  });

  it('filters tombstones', () => {
    const recId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' as RecurrenceId;
    const r1 = buildRecurrenceRule({
      rowId: 'row-1' as RowId,
      recurrenceId: recId,
      deviceId: 'A',
      mode: 'recurring',
      accountId: 'acc-1',
      lines: [{ categoryId: 'cat-1', amountMinor: 5000 as Minor }],
      dayOfMonth: 1,
      startDate: '2026-01-01',
    }, '0000100-0000-A');

    const tomb = buildRecurrenceRule({
      rowId: 'row-2' as RowId,
      recurrenceId: recId,
      deviceId: 'A',
      mode: 'recurring',
      isDeleted: true,
      accountId: 'acc-1',
      lines: [],
      dayOfMonth: 1,
      startDate: '2026-01-01',
    }, '0000200-0000-A');

    const result = resolveCurrentRules([r1, tomb]);
    expect(result.length).toBe(0);
  });

  it('resolves multiple rules independently', () => {
    const r1 = makeRule();
    const r2 = buildRecurrenceRule({
      rowId: 'row-2' as RowId,
      recurrenceId: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff' as RecurrenceId,
      deviceId: 'A',
      mode: 'installment',
      accountId: 'acc-1',
      lines: [{ categoryId: 'cat-1', amountMinor: 1000 as Minor }],
      dayOfMonth: 15,
      startDate: '2026-03-15',
      totalInstallments: 6,
      originalTotalMinor: 6000 as Minor,
    }, 'v1');

    const result = resolveCurrentRules([r1, r2]);
    expect(result.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// pendingMaterializationDates
// ---------------------------------------------------------------------------

describe('pendingMaterializationDates', () => {
  it('returns all months from startDate to today for a new recurring rule', () => {
    const rule = makeRule({ startDate: '2026-01-01' } as Partial<RecurrenceRule>);
    const dates = pendingMaterializationDates(rule, '2026-04-15');
    expect(dates).toEqual(['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01']);
  });

  it('returns months after lastMaterializedDate', () => {
    const rule = makeRule({
      startDate: '2026-01-01',
      lastMaterializedDate: '2026-02-01',
      materializedCount: 2,
    } as Partial<RecurrenceRule>);
    const dates = pendingMaterializationDates(rule, '2026-04-15');
    expect(dates).toEqual(['2026-03-01', '2026-04-01']);
  });

  it('returns empty for inactive rule', () => {
    const rule = makeRule({ isActive: false } as Partial<RecurrenceRule>);
    const dates = pendingMaterializationDates(rule, '2026-12-31');
    expect(dates).toEqual([]);
  });

  it('returns empty when start date is in the future', () => {
    const rule = makeRule({ startDate: '2027-06-01' } as Partial<RecurrenceRule>);
    const dates = pendingMaterializationDates(rule, '2026-04-15');
    expect(dates).toEqual([]);
  });

  it('includes today if today equals an occurrence date', () => {
    const rule = makeRule({ startDate: '2026-04-01' } as Partial<RecurrenceRule>);
    const dates = pendingMaterializationDates(rule, '2026-04-01');
    expect(dates).toEqual(['2026-04-01']);
  });

  it('stops at totalInstallments for installment mode', () => {
    const rule = buildRecurrenceRule({
      rowId: 'r1' as RowId,
      recurrenceId: 'rec1' as RecurrenceId,
      deviceId: 'A',
      mode: 'installment',
      accountId: 'acc1',
      lines: [{ categoryId: 'cat1', amountMinor: 500 as Minor }],
      dayOfMonth: 1,
      startDate: '2026-01-01',
      totalInstallments: 3,
      originalTotalMinor: 1500 as Minor,
    }, 'v1');

    const dates = pendingMaterializationDates(rule, '2026-12-31');
    expect(dates).toEqual(['2026-01-01', '2026-02-01', '2026-03-01']);
    expect(dates.length).toBe(3);
  });

  it('accounts for already-materialized installments', () => {
    const rule = buildRecurrenceRule({
      rowId: 'r1' as RowId,
      recurrenceId: 'rec1' as RecurrenceId,
      deviceId: 'A',
      mode: 'installment',
      accountId: 'acc1',
      lines: [{ categoryId: 'cat1', amountMinor: 500 as Minor }],
      dayOfMonth: 1,
      startDate: '2026-01-01',
      totalInstallments: 3,
      originalTotalMinor: 1500 as Minor,
      lastMaterializedDate: '2026-01-01',
      materializedCount: 1,
    }, 'v1');

    const dates = pendingMaterializationDates(rule, '2026-12-31');
    expect(dates).toEqual(['2026-02-01', '2026-03-01']);
    expect(dates.length).toBe(2);
  });

  it('handles year boundary correctly', () => {
    const rule = makeRule({
      startDate: '2026-11-01',
      dayOfMonth: 1,
    } as Partial<RecurrenceRule>);
    const dates = pendingMaterializationDates(rule, '2027-02-15');
    expect(dates).toEqual(['2026-11-01', '2026-12-01', '2027-01-01', '2027-02-01']);
  });

  it('uses dayOfMonth for non-start-date months', () => {
    const rule = makeRule({
      startDate: '2026-01-15',
      dayOfMonth: 15,
    } as Partial<RecurrenceRule>);
    const dates = pendingMaterializationDates(rule, '2026-03-20');
    expect(dates).toEqual(['2026-01-15', '2026-02-15', '2026-03-15']);
  });
});

// ---------------------------------------------------------------------------
// materializationTxId
// ---------------------------------------------------------------------------

describe('materializationTxId', () => {
  const recurrenceId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  it('is deterministic — same inputs produce same output', () => {
    const id1 = materializationTxId(recurrenceId, '2026-10-01');
    const id2 = materializationTxId(recurrenceId, '2026-10-01');
    expect(id1).toBe(id2);
  });

  it('produces different ids for different dates', () => {
    const id1 = materializationTxId(recurrenceId, '2026-10-01');
    const id2 = materializationTxId(recurrenceId, '2026-11-01');
    expect(id1).not.toBe(id2);
  });

  it('produces different ids for different recurrenceIds', () => {
    const id1 = materializationTxId(recurrenceId, '2026-10-01');
    const id2 = materializationTxId('bbbbbbbb-cccc-dddd-eeee-ffffffffffff', '2026-10-01');
    expect(id1).not.toBe(id2);
  });

  it('produces valid UUID format', () => {
    const id = materializationTxId(recurrenceId, '2026-10-01');
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});
