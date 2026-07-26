import { useState, useMemo } from 'react';
import { Minor, TxVersion } from '@/kernel';

export function useMonthlyLedger(currentTxs: TxVersion[], accountId?: string) {
  const [currentMonthStr, setCurrentMonthStr] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const handlePrevMonth = () => {
    const [y, m] = currentMonthStr.split('-');
    const date = new Date(Number(y), Number(m) - 2);
    setCurrentMonthStr(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [y, m] = currentMonthStr.split('-');
    const date = new Date(Number(y), Number(m));
    setCurrentMonthStr(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const filteredTxs = useMemo(() => {
    let filtered = currentTxs.filter(tx => tx.occurredAt.startsWith(currentMonthStr));
    if (accountId) {
      filtered = filtered.filter(tx => tx.accountId === accountId || tx.transferAccountId === accountId);
    }
    return filtered;
  }, [currentTxs, accountId, currentMonthStr]);

  const { monthIncome, monthExpense, monthTotal } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const tx of filteredTxs) {
      if (tx.type === 'income') {
        inc += tx.totalMinor;
      } else if (tx.type === 'expense') {
        exp += tx.totalMinor;
      }
    }
    return {
      monthIncome: inc as Minor,
      monthExpense: exp as Minor,
      monthTotal: (inc - exp) as Minor
    };
  }, [filteredTxs]);

  const monthName = useMemo(() => {
    const [y, m] = currentMonthStr.split('-');
    return new Date(Number(y), Number(m) - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }, [currentMonthStr]);

  return {
    currentMonthStr,
    handlePrevMonth,
    handleNextMonth,
    filteredTxs,
    monthIncome,
    monthExpense,
    monthTotal,
    monthName,
  };
}
