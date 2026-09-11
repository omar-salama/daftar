import { getBillingCycle } from '@/kernel';

interface AccountInfo {
  accountId: string;
  billingCycleStartDay?: number;
  paymentDay?: number;
}

/**
 * For installment transactions on credit-card accounts, override the
 * transaction date with the billing-cycle payment date.
 */
export function resolveInstallmentDate(
  date: string,
  accountId: string,
  accounts: AccountInfo[],
): string {
  const account = accounts.find(a => a.accountId === accountId);
  if (account?.billingCycleStartDay && account?.paymentDay) {
    const cycle = getBillingCycle(
      account.billingCycleStartDay,
      date,
      account.paymentDay,
    );
    if (cycle.paymentDate) {
      return cycle.paymentDate;
    }
  }
  return date;
}
