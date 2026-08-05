export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function getDateString(year: number, month: number, day: number): string {
  const maxDay = daysInMonth(year, month);
  const actualDay = Math.min(day, maxDay);
  return `${year}-${String(month).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`;
}

export interface BillingCycle {
  startDate: string;
  endDate: string;
  paymentDate?: string;
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getBillingCycle(
  cycleStartDay: number,
  calendarDate: string,
  paymentDay?: number
): BillingCycle {
  const [y, m] = calendarDate.split('-').map(Number);
  
  const currentMonthStartStr = getDateString(y, m, cycleStartDay);
  
  let startDate: string;
  let nextStartDate: string;
  
  if (calendarDate >= currentMonthStartStr) {
    startDate = currentMonthStartStr;
    
    let nextY = y;
    let nextM = m + 1;
    if (nextM === 13) {
      nextM = 1;
      nextY += 1;
    }
    nextStartDate = getDateString(nextY, nextM, cycleStartDay);
  } else {
    nextStartDate = currentMonthStartStr;
    
    let prevY = y;
    let prevM = m - 1;
    if (prevM === 0) {
      prevM = 12;
      prevY -= 1;
    }
    startDate = getDateString(prevY, prevM, cycleStartDay);
  }
  
  const endDate = addDays(nextStartDate, -1);
  
  let paymentDate: string | undefined = undefined;
  if (paymentDay !== undefined) {
    const [cy, cm, cd] = endDate.split('-').map(Number);
    if (paymentDay > cd) {
      paymentDate = getDateString(cy, cm, paymentDay);
    } else {
      let nextCy = cy;
      let nextCm = cm + 1;
      if (nextCm === 13) {
        nextCm = 1;
        nextCy += 1;
      }
      paymentDate = getDateString(nextCy, nextCm, paymentDay);
    }
  }
  
  return {
    startDate,
    endDate,
    paymentDate,
  };
}
