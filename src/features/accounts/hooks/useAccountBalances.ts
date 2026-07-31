import { useMemo } from 'react';
import { useLedger } from '@/features/ledger/hooks/useLedger';
import { useAccounts } from './useAccounts';
import { useAccountTypes } from '@/features/account-types/hooks';
import { getBillingCycle, addDays } from '@/kernel/date';

export function useAccountBalances() {
  const { data: accounts } = useAccounts();
  const { data: accountTypes } = useAccountTypes();
  const { data: txs } = useLedger();

  return useMemo(() => {
    const balances: Record<string, number> = {};
    const payableBalances: Record<string, number> = {};
    const prevClosingDates: Record<string, string> = {};

    if (!accounts) return { balances, payableBalances, totalAssets: 0, totalLiabilities: 0, netWorth: 0 };

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Initialize balances
    for (const acc of accounts) {
      balances[acc.accountId] = acc.initialBalance || 0;
      payableBalances[acc.accountId] = acc.initialBalance || 0;
      
      if (acc.closingDay !== undefined) {
        const cycle = getBillingCycle(acc.closingDay, todayStr);
        prevClosingDates[acc.accountId] = addDays(cycle.periodStart, -1);
      }
    }

    // Calculate balances
    if (txs) {
      for (const tx of txs) {
        // Current Balances
        if (tx.accountId && balances[tx.accountId] !== undefined) {
          if (tx.type === 'expense') balances[tx.accountId] -= tx.totalMinor;
          else if (tx.type === 'income') balances[tx.accountId] += tx.totalMinor;
          else if (tx.type === 'transfer') balances[tx.accountId] -= tx.totalMinor;
        }
        
        if (tx.transferAccountId && balances[tx.transferAccountId] !== undefined) {
          if (tx.type === 'expense' || tx.type === 'transfer') balances[tx.transferAccountId] += tx.totalMinor;
        }

        // Payable Balances
        if (tx.accountId && payableBalances[tx.accountId] !== undefined) {
          const prevClosingDate = prevClosingDates[tx.accountId];
          const shouldApplyNormally = !prevClosingDate || tx.occurredAt <= prevClosingDate;
          
          if (shouldApplyNormally) {
            if (tx.type === 'expense' || tx.type === 'transfer') payableBalances[tx.accountId] -= tx.totalMinor;
            else if (tx.type === 'income') payableBalances[tx.accountId] += tx.totalMinor;
          }
        }

        if (tx.transferAccountId && payableBalances[tx.transferAccountId] !== undefined) {
          const prevClosingDate = prevClosingDates[tx.transferAccountId];
          const shouldApplyNormally = !prevClosingDate || tx.occurredAt <= prevClosingDate;
          
          if (tx.type === 'expense' || tx.type === 'transfer') {
            if (shouldApplyNormally) {
              payableBalances[tx.transferAccountId] += tx.totalMinor;
            } else if (tx.type === 'transfer') {
              // It's AFTER the closing date, but it's a TRANSFER (payment) into this account.
              // Apply it to reduce the payable balance.
              payableBalances[tx.transferAccountId] += tx.totalMinor;
            }
          }
        }
      }
    }

    let totalAssets = 0;
    let totalLiabilities = 0;

    const accountTypeMap = new Map(accountTypes?.map(t => [t.accountTypeId, t]));

    for (const acc of accounts) {
      const bal = balances[acc.accountId] || 0;
      const typeInfo = accountTypeMap.get(acc.type as import('@/features/account-types/model').AccountTypeId);
      
      if (typeInfo?.isLiability) {
        if (bal < 0) totalLiabilities += Math.abs(bal);
      } else {
        totalAssets += bal;
      }
    }

    const netWorth = totalAssets - totalLiabilities;

    return { balances, payableBalances, totalAssets, totalLiabilities, netWorth };
  }, [accounts, txs, accountTypes]);
}
