import { AccountVersion } from '@/features/accounts/model';
import { Minor, TxVersion } from '@/kernel';
import { addDays, getBillingCycle, getPaymentDate } from '@/kernel/date';
import { useMemo, useState } from 'react';

export function useLedgerDateFilter(currentTxs: TxVersion[], accountId?: string, account?: AccountVersion) {
  const [currentCalendarDate, setCurrentCalendarDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  const isCreditCard = account?.closingDay !== undefined;

  // Monthly logic
  const currentMonthStr = currentCalendarDate.substring(0, 7);
  
  // Billing cycle logic
  const billingCycle = useMemo(() => {
    if (!isCreditCard || account.closingDay === undefined) return null;
    return getBillingCycle(account.closingDay, currentCalendarDate);
  }, [isCreditCard, account?.closingDay, currentCalendarDate]);

  const paymentDate = useMemo(() => {
    if (!billingCycle || !account) return null;
    return getPaymentDate(billingCycle.closingDate, account.paymentDateType, account.paymentDateValue);
  }, [billingCycle, account]);

  const handlePrev = () => {
    if (isCreditCard && billingCycle) {
      setCurrentCalendarDate(addDays(billingCycle.periodStart, -1));
    } else {
      const [y, m] = currentMonthStr.split('-');
      const date = new Date(Number(y), Number(m) - 2);
      setCurrentCalendarDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`);
    }
  };

  const handleNext = () => {
    if (isCreditCard && billingCycle) {
      setCurrentCalendarDate(addDays(billingCycle.closingDate, 1));
    } else {
      const [y, m] = currentMonthStr.split('-');
      const date = new Date(Number(y), Number(m));
      setCurrentCalendarDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`);
    }
  };

  const filteredTxs = useMemo(() => {
    let filtered = currentTxs;
    
    if (isCreditCard && billingCycle) {
      filtered = filtered.filter(tx => 
        tx.occurredAt >= billingCycle.periodStart && tx.occurredAt <= billingCycle.closingDate
      );
    } else {
      filtered = filtered.filter(tx => tx.occurredAt.startsWith(currentMonthStr));
    }
    
    if (accountId) {
      filtered = filtered.filter(tx => tx.accountId === accountId || tx.transferAccountId === accountId);
    }
    return filtered;
  }, [currentTxs, accountId, isCreditCard, billingCycle, currentMonthStr]);

  const { totalIncome, totalExpense, totalNet } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const tx of filteredTxs) {
      if (tx.type === 'income') {
        inc += tx.totalMinor;
      } else if (tx.type === 'expense') {
        exp += tx.totalMinor;
        // for a specific account ledger, we calculate all money in & money out
      } else if (tx.type === 'transfer' && accountId) {
        if (tx.accountId === accountId) {
          exp += tx.totalMinor;
        } else if (tx.transferAccountId === accountId) {
          inc += tx.totalMinor;
        }
      }
    }
    return {
      totalIncome: inc as Minor,
      totalExpense: exp as Minor,
      totalNet: (inc - exp) as Minor
    };
  }, [filteredTxs, accountId]);

  const periodName = useMemo(() => {
    if (isCreditCard && billingCycle) {
      // Format as e.g. "Jun 16 – Jul 15"
      const formatStr = (dStr: string) => {
        const [y, m, d] = dStr.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleString('en-US', { month: 'short', day: 'numeric' });
      };
      return `${formatStr(billingCycle.periodStart)} – ${formatStr(billingCycle.closingDate)}`;
    }
    const [y, m] = currentMonthStr.split('-');
    return new Date(Number(y), Number(m) - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }, [isCreditCard, billingCycle, currentMonthStr]);

  return {
    handlePrev,
    handleNext,
    filteredTxs,
    totalIncome,
    totalExpense,
    totalNet,
    periodName,
    paymentDate,
  };
}
