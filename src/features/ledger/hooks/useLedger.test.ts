import { describe, it, expect } from 'vitest';
import { resolveCurrent, TxVersion, TxId, RowId, Minor } from '../../../kernel';

describe('optimistic resolver', () => {
  it('correctly resolves edit and tombstone in optimistic cache update', () => {
    const baseTx: TxVersion = {
      rowId: 'row1' as RowId,
      txId: 'tx1' as TxId,
      version: '000000000000100-0001-deviceA',
      deviceId: 'deviceA',
      type: 'expense',
      isDeleted: false,
      occurredAt: '2023-01-01',
      accountId: 'acc1',
      lines: [{ categoryId: 'cat1', amountMinor: 100 as Minor }],
      totalMinor: 100 as Minor,
    };

    // 1. Edit
    const editTx: TxVersion = {
      ...baseTx,
      rowId: 'row2' as RowId,
      version: '000000000000200-0001-deviceA',
      totalMinor: 200 as Minor,
    };
    
    const resolvedAfterEdit = resolveCurrent([baseTx, editTx]);
    expect(resolvedAfterEdit).toHaveLength(1);
    expect(resolvedAfterEdit[0].totalMinor).toBe(200);
    expect(resolvedAfterEdit[0].version).toBe('000000000000200-0001-deviceA');

    // 2. Tombstone
    const tombstoneTx: TxVersion = {
      ...baseTx,
      rowId: 'row3' as RowId,
      version: '000000000000300-0001-deviceA',
      isDeleted: true,
    };

    const resolvedAfterTombstone = resolveCurrent([baseTx, editTx, tombstoneTx]);
    expect(resolvedAfterTombstone).toHaveLength(0); // tombstone should cause it to be filtered out
  });
});
