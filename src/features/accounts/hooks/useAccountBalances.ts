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
  const payableBalances: Record<string, number> = {};
  const prevClosingDates: Record<string, string> = {};
  const todayStr = getTodayString();

  for (const acc of accounts) {
    balances[acc.accountId] = acc.initialBalance || 0;
    payableBalances[acc.accountId] = acc.initialBalance || 0;
    
    if (acc.closingDay !== undefined) {
      const cycle = getBillingCycle(acc.closingDay, todayStr);
      prevClosingDates[acc.accountId] = addDays(cycle.periodStart, -1);
    }
  }

  return { balances, payableBalances, prevClosingDates };
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

function applyPayableBalance(tx: TxVersion, payableBalances: Record<string, number>, prevClosingDates: Record<string, string>) {
  // Apply to source account
  if (tx.accountId && payableBalances[tx.accountId] !== undefined) {
    const closingDate = prevClosingDates[tx.accountId];
    const isIncludedInStatement = !closingDate || tx.occurredAt <= closingDate;
    
    if (isIncludedInStatement) {
      payableBalances[tx.accountId] += getAccountBalanceImpact(tx, tx.accountId);
    }
  }

  // Apply to destination account
  if (tx.transferAccountId && payableBalances[tx.transferAccountId] !== undefined) {
    const closingDate = prevClosingDates[tx.transferAccountId];
    const isIncludedInStatement = !closingDate || tx.occurredAt <= closingDate;
    const isPaymentAfterClosing = !isIncludedInStatement && tx.type === 'transfer';
    
    if (isIncludedInStatement || isPaymentAfterClosing) {
      payableBalances[tx.transferAccountId] += getAccountBalanceImpact(tx, tx.transferAccountId);
    }
  }
}

function applyTransactions(
  txs: TxVersion[],
  balances: Record<string, number>,
  payableBalances: Record<string, number>,
  prevClosingDates: Record<string, string>
) {
  for (const tx of txs) {
    applyCurrentBalance(tx, balances);
    applyPayableBalance(tx, payableBalances, prevClosingDates);
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
    if (!accounts) return { balances: {}, payableBalances: {}, totalAssets: 0, totalLiabilities: 0, netWorth: 0 };

    const { balances, payableBalances, prevClosingDates } = initializeAccountStates(accounts);
    
    if (txs) {
      applyTransactions(txs, balances, payableBalances, prevClosingDates);
    }

    const { totalAssets, totalLiabilities, netWorth } = calculateNetWorth(accounts, accountTypes || [], balances);

    return { balances, payableBalances, totalAssets, totalLiabilities, netWorth };
  }, [accounts, txs, accountTypes]);
}
