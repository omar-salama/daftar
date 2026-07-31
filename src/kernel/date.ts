export function daysInMonth(year: number, month: number): number {
  // month is 1-12
  // Date constructor takes month 0-11. 
  // Using month index (0-based) for the *next* month and day 0 gives the last day of the *current* month.
  return new Date(year, month, 0).getDate();
}

export function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function getClosingDate(year: number, month: number, closingDay: number): string {
  const maxDay = daysInMonth(year, month);
  const actualDay = Math.min(closingDay, maxDay);
  return `${year}-${String(month).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`;
}

export interface BillingCycle {
  periodStart: string;
  closingDate: string;
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getBillingCycle(closingDay: number, calendarDate: string): BillingCycle {
  const [y, m] = calendarDate.split('-').map(Number);
  
  // Calculate the closing date for the current month
  const currentMonthClosingDate = getClosingDate(y, m, closingDay);
  
  let cycleClosingDate: string;
  let previousClosingDate: string;
  
  if (calendarDate <= currentMonthClosingDate) {
    // The calendarDate is on or before this month's closing date, so it belongs to this month's cycle.
    cycleClosingDate = currentMonthClosingDate;
    
    // Previous closing date is in the previous month
    let prevY = y;
    let prevM = m - 1;
    if (prevM === 0) {
      prevM = 12;
      prevY -= 1;
    }
    previousClosingDate = getClosingDate(prevY, prevM, closingDay);
  } else {
    // The calendarDate is after this month's closing date, so it belongs to the next month's cycle.
    let nextY = y;
    let nextM = m + 1;
    if (nextM === 13) {
      nextM = 1;
      nextY += 1;
    }
    cycleClosingDate = getClosingDate(nextY, nextM, closingDay);
    previousClosingDate = currentMonthClosingDate;
  }
  
  // periodStart is previousClosingDate + 1 day
  const periodStart = addDays(previousClosingDate, 1);
  
  return {
    periodStart,
    closingDate: cycleClosingDate,
  };
}

export function getPaymentDate(
  closingDate: string,
  paymentDateType?: 'fixed_day' | 'days_after_closing',
  paymentDateValue?: number
): string | undefined {
  if (!paymentDateType || paymentDateValue === undefined) return undefined;
  
  if (paymentDateType === 'days_after_closing') {
    return addDays(closingDate, paymentDateValue);
  }
  
  if (paymentDateType === 'fixed_day') {
    const [y, m] = closingDate.split('-').map(Number);
    let nextY = y;
    let nextM = m + 1;
    if (nextM === 13) {
      nextM = 1;
      nextY += 1;
    }
    return getClosingDate(nextY, nextM, paymentDateValue);
  }
  
  return undefined;
}
