import { useMemo } from 'react';
import { useLedger } from '@/features/ledger/hooks/useLedger';
import { useAccounts } from './useAccounts';

export function useAccountBalances() {
  const { data: accounts } = useAccounts();
  const { data: txs } = useLedger();

  return useMemo(() => {
    const balances: Record<string, number> = {};
    if (!accounts) return { balances, totalAssets: 0, totalLiabilities: 0, netWorth: 0 };

    // Initialize balances
    for (const acc of accounts) {
      balances[acc.accountId] = acc.initialBalance || 0;
    }

    // Calculate balances
    if (txs) {
      for (const tx of txs) {
        if (tx.accountId && balances[tx.accountId] !== undefined) {
          if (tx.type === 'expense') {
            balances[tx.accountId] -= tx.totalMinor;
          } else if (tx.type === 'income') {
            balances[tx.accountId] += tx.totalMinor;
          } else if (tx.type === 'transfer') {
            balances[tx.accountId] -= tx.totalMinor;
          }
        }
        
        if (tx.transferAccountId && balances[tx.transferAccountId] !== undefined) {
          if (tx.type === 'expense' || tx.type === 'transfer') {
            balances[tx.transferAccountId] += tx.totalMinor;
          }
        }
      }
    }

    let totalAssets = 0;
    let totalLiabilities = 0;

    for (const acc of accounts) {
      const bal = balances[acc.accountId] || 0;
      if (acc.type === 'credit') {
        // Credit accounts usually have negative balances when you owe money
        // We sum the outstanding credit (which is the negative balance) as a positive liability
        if (bal < 0) {
          totalLiabilities += Math.abs(bal);
        }
      } else {
        totalAssets += bal;
      }
    }

    const netWorth = totalAssets - totalLiabilities;

    return { balances, totalAssets, totalLiabilities, netWorth };
  }, [accounts, txs]);
}
