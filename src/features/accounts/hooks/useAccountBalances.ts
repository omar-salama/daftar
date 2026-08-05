import { useAccountTypes } from '@/features/account-types/hooks';
import { AccountTypeVersion } from '@/features/account-types/model';
import { useLedger } from '@/features/ledger/hooks/useLedger';
import { TxVersion } from '@/kernel';
import { addDays, getBillingCycle, getTodayString } from '@/kernel/date';
import { useMemo } from 'react';
import { AccountVersion } from '../model';
import { useAccounts } from './useAccounts';

function initializeAccountStates(accounts: AccountVersion[]) {
  const balances: Record<string, number> = {};
  const dueAmounts: Record<string, number> = {};
  const prevBillingCycleEndDates: Record<string, string> = {};
  const todayStr = getTodayString();

  for (const acc of accounts) {
    balances[acc.accountId] = acc.initialBalance || 0;
    dueAmounts[acc.accountId] = acc.initialBalance || 0;

    if (acc.billingCycleStartDay !== undefined) {
      const cycle = getBillingCycle(acc.billingCycleStartDay, todayStr);
      prevBillingCycleEndDates[acc.accountId] = addDays(cycle.startDate, -1);
    }
  }

  return { balances, dueAmounts, prevBillingCycleEndDates };
}

/**
 * Returns the net change in balance for a specific account given a transaction.
 * - Expenses and transfers OUT reduce the balance (negative impact).
 * - Income and transfers IN increase the balance (positive impact).
 */
function getAccountBalanceImpact(tx: TxVersion, accountId: string): number {
  if (tx.accountId === accountId) {
    if (tx.type === 'expense' || tx.type === 'transfer') return -tx.totalMinor;
    if (tx.type === 'income') return tx.totalMinor;
  }
  if (tx.transferAccountId === accountId) {
    if (tx.type === 'expense' || tx.type === 'transfer') return tx.totalMinor;
  }
  return 0;
}

function applyCurrentBalance(tx: TxVersion, balances: Record<string, number>) {
  if (tx.accountId && balances[tx.accountId] !== undefined) {
    balances[tx.accountId] += getAccountBalanceImpact(tx, tx.accountId);
  }
  if (tx.transferAccountId && balances[tx.transferAccountId] !== undefined) {
    balances[tx.transferAccountId] += getAccountBalanceImpact(tx, tx.transferAccountId);
  }
}

function ApplyDueAmount(tx: TxVersion, dueAmounts: Record<string, number>, prevBillingCycleEndDates: Record<string, string>) {
  // Apply to source account
  if (tx.accountId && dueAmounts[tx.accountId] !== undefined) {
    const billingCycleEndDate = prevBillingCycleEndDates[tx.accountId];
    const isIncludedInCycle = !billingCycleEndDate || tx.occurredAt <= billingCycleEndDate;

    if (isIncludedInCycle) {
      dueAmounts[tx.accountId] += getAccountBalanceImpact(tx, tx.accountId);
    }
  }

  // Apply to destination account
  if (tx.transferAccountId && dueAmounts[tx.transferAccountId] !== undefined) {
    const billingCycleEndDate = prevBillingCycleEndDates[tx.transferAccountId];
    const isIncludedInCycle = !billingCycleEndDate || tx.occurredAt <= billingCycleEndDate;
    const isPaymentAfterBillingCycleEnd = !isIncludedInCycle && tx.type === 'transfer';

    if (isIncludedInCycle || isPaymentAfterBillingCycleEnd) {
      dueAmounts[tx.transferAccountId] += getAccountBalanceImpact(tx, tx.transferAccountId);
    }
  }
}

function applyTransactions(
  txs: TxVersion[],
  balances: Record<string, number>,
  dueAmounts: Record<string, number>,
  prevBillingCycleEndDates: Record<string, string>
) {
  for (const tx of txs) {
    applyCurrentBalance(tx, balances);
    ApplyDueAmount(tx, dueAmounts, prevBillingCycleEndDates);
  }
}

function calculateNetWorth(accounts: AccountVersion[], accountTypes: AccountTypeVersion[], balances: Record<string, number>) {
  let totalAssets = 0;
  let totalLiabilities = 0;
  const accountTypeMap = new Map(accountTypes.map(t => [t.accountTypeId, t]));

  for (const acc of accounts) {
    const bal = balances[acc.accountId] || 0;
    const typeInfo = accountTypeMap.get(acc.type as import('@/features/account-types/model').AccountTypeId);

    if (typeInfo?.isLiability) {
      if (bal < 0) totalLiabilities += Math.abs(bal);
    } else {
      totalAssets += bal;
    }
  }

  return { totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities };
}

export function useAccountBalances() {
  const { data: accounts } = useAccounts();
  const { data: accountTypes } = useAccountTypes();
  const { data: txs } = useLedger();

  return useMemo(() => {
    if (!accounts) return { balances: {}, dueAmounts: {}, totalAssets: 0, totalLiabilities: 0, netWorth: 0 };

    const { balances, dueAmounts, prevBillingCycleEndDates } = initializeAccountStates(accounts);

    if (txs) {
      applyTransactions(txs, balances, dueAmounts, prevBillingCycleEndDates);
    }

    const { totalAssets, totalLiabilities, netWorth } = calculateNetWorth(accounts, accountTypes || [], balances);

    return { balances, dueAmounts, totalAssets, totalLiabilities, netWorth };
  }, [accounts, txs, accountTypes]);
}
