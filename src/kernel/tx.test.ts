import { describe, expect, it } from 'vitest';
import { Minor } from './money';
import { buildTxVersion, resolveCurrent, RowId, TxId } from './tx';

describe('tx kernel', () => {
  describe('buildTxVersion', () => {
    it('computes totalMinor correctly from lines', () => {
      const v = buildTxVersion({
        rowId: 'r1' as RowId,
        txId: 'tx1' as TxId,
        deviceId: 'deviceA',
        occurredAt: '2026-07-24',
        accountId: 'acc1',
        lines: [
          { categoryId: 'cat1', amountMinor: 100 as Minor },
          { categoryId: 'cat2', amountMinor: 50 as Minor },
        ]
      }, 'v1');

      expect(v.totalMinor).toBe(150);
    });

    it('split totals invariant: line amounts sum exactly to totalMinor', () => {
      const lines = [
        { categoryId: 'food', amountMinor: 3333 as Minor },
        { categoryId: 'drinks', amountMinor: 3333 as Minor },
        { categoryId: 'tip', amountMinor: 3334 as Minor },
      ];

      const v = buildTxVersion({
        rowId: 'r1' as RowId,
        txId: 'tx1' as TxId,
        deviceId: 'deviceA',
        occurredAt: '2026-07-24',
        accountId: 'acc1',
        lines,
      }, 'v1');

      expect(v.totalMinor).toBe(10000);
      const lineSum = lines.reduce((sum, line) => sum + line.amountMinor, 0);
      expect(lineSum).toBe(v.totalMinor);
    });

    it('throws if lines are empty and not deleted', () => {
      expect(() => buildTxVersion({
        rowId: 'r1' as RowId,
        txId: 'tx1' as TxId,
        deviceId: 'deviceA',
        occurredAt: '2026-07-24',
        accountId: 'acc1',
        lines: []
      }, 'v1')).toThrow(/least one line/);
    });

    it('allows empty lines if isDeleted is true', () => {
      const v = buildTxVersion({
        rowId: 'r1' as RowId,
        txId: 'tx1' as TxId,
        deviceId: 'deviceA',
        isDeleted: true,
        occurredAt: '2026-07-24',
        accountId: 'acc1',
        lines: []
      }, 'v1');
      expect(v.isDeleted).toBe(true);
    });
    
    it('throws on unsafe integer amounts', () => {
      expect(() => buildTxVersion({
        rowId: 'r1' as RowId,
        txId: 'tx1' as TxId,
        deviceId: 'deviceA',
        occurredAt: '2026-07-24',
        accountId: 'acc1',
        lines: [
          { categoryId: 'cat1', amountMinor: 12.34 as unknown as Minor },
        ]
      }, 'v1')).toThrow(/Unsafe integer/);
    });

    it('defaults type to expense when omitted', () => {
      const v = buildTxVersion({
        rowId: 'r1' as RowId,
        txId: 'tx1' as TxId,
        deviceId: 'deviceA',
        occurredAt: '2026-07-24',
        accountId: 'acc1',
        lines: [{ categoryId: 'cat1', amountMinor: 100 as Minor }],
      }, 'v1');
      expect(v.type).toBe('expense');
    });

    it('preserves income type when specified', () => {
      const v = buildTxVersion({
        rowId: 'r1' as RowId,
        txId: 'tx1' as TxId,
        deviceId: 'deviceA',
        type: 'income',
        occurredAt: '2026-07-24',
        accountId: 'acc1',
        lines: [{ categoryId: 'salary', amountMinor: 500000 as Minor }],
      }, 'v1');
      expect(v.type).toBe('income');
      expect(v.totalMinor).toBe(500000);
    });

    it('retains exchange rate and converted amounts', () => {
      const v = buildTxVersion({
        rowId: 'r1' as RowId,
        txId: 'tx1' as TxId,
        deviceId: 'deviceA',
        occurredAt: '2026-07-24',
        accountId: 'acc1',
        exchangeRate: 50.62,
        lines: [{ categoryId: 'cat1', amountMinor: 10000 as Minor, mainCurrencyAmountMinor: 506200 as Minor }],
      }, 'v1');
      
      expect(v.exchangeRate).toBe(50.62);
      expect(v.lines[0].mainCurrencyAmountMinor).toBe(506200);
    });

    it('retains transfer amounts and rates for cross-currency transfers', () => {
      const v = buildTxVersion({
        rowId: 'r1' as RowId,
        txId: 'tx1' as TxId,
        deviceId: 'deviceA',
        type: 'transfer',
        occurredAt: '2026-07-24',
        accountId: 'acc1',
        transferAccountId: 'acc2',
        lines: [{ categoryId: 'transfer', amountMinor: 10000 as Minor }], // 100 USD
        transferAmountMinor: 495000 as Minor, // 4950 EGP
        transferExchangeRate: 49.5,
      }, 'v1');
      
      expect(v.transferAmountMinor).toBe(495000);
      expect(v.transferExchangeRate).toBe(49.5);
    });
  });

  describe('resolveCurrent', () => {
    it('groups by txId and picks max version string', () => {
      const v1 = buildTxVersion({
        rowId: 'r1' as RowId, txId: 'tx1' as TxId, deviceId: 'A',
        occurredAt: '2026-07-24', accountId: 'acc1',
        lines: [{ categoryId: 'cat1', amountMinor: 100 as Minor }]
      }, '0000100-0000-A');
      
      const v2 = buildTxVersion({
        rowId: 'r2' as RowId, txId: 'tx1' as TxId, deviceId: 'B',
        occurredAt: '2026-07-24', accountId: 'acc1',
        lines: [{ categoryId: 'cat1', amountMinor: 200 as Minor }]
      }, '0000101-0000-B');

      const v3 = buildTxVersion({
        rowId: 'r3' as RowId, txId: 'tx2' as TxId, deviceId: 'A',
        occurredAt: '2026-07-24', accountId: 'acc1',
        lines: [{ categoryId: 'cat2', amountMinor: 50 as Minor }]
      }, '0000050-0000-A');

      const current = resolveCurrent([v1, v2, v3]);
      expect(current.length).toBe(2);
      expect(current.find(tx => tx.txId === 'tx1')?.totalMinor).toBe(200); // v2 won
      expect(current.find(tx => tx.txId === 'tx2')?.totalMinor).toBe(50);
    });

    it('filters out tombstones from the final view', () => {
      const v1 = buildTxVersion({
        rowId: 'r1' as RowId, txId: 'tx1' as TxId, deviceId: 'A',
        occurredAt: '2026-07-24', accountId: 'acc1',
        lines: [{ categoryId: 'cat1', amountMinor: 100 as Minor }]
      }, '0000100-0000-A');
      
      const vTombstone = buildTxVersion({
        rowId: 'r2' as RowId, txId: 'tx1' as TxId, deviceId: 'A',
        isDeleted: true,
        occurredAt: '2026-07-24', accountId: 'acc1',
        lines: []
      }, '0000101-0000-A');

      const current = resolveCurrent([v1, vTombstone]);
      expect(current.length).toBe(0);
    });
  });
});
