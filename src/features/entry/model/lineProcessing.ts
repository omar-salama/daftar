import type { TxLine } from '@/kernel/tx';
import type { Minor } from '@/kernel/money';

/**
 * Attach mainCurrencyAmountMinor to each line based on exchange rate.
 */
export function computeMainCurrencyLines(
  lines: TxLine[],
  exchangeRate?: number
): TxLine[] {
  return lines.map(line => {
    const mainMinor = exchangeRate
      ? Math.round(line.amountMinor * exchangeRate) as Minor
      : line.amountMinor;
    return {
      ...line,
      mainCurrencyAmountMinor: mainMinor,
    };
  });
}

/**
 * Re-proportion split lines for a single installment payment.
 * The first line matching totalMinor gets the installment amount directly;
 * remaining lines are scaled proportionally.
 */
export function proportionLinesForInstallment(
  lines: TxLine[],
  totalMinor: Minor,
  installmentAmount: Minor,
  exchangeRate?: number
): TxLine[] {
  return lines.map(line => {
    let newMinor: Minor;
    if (line.amountMinor === totalMinor) {
      newMinor = installmentAmount;
    } else {
      const ratio = line.amountMinor / totalMinor;
      newMinor = Math.round(installmentAmount * ratio) as Minor;
    }
    const mainMinor = exchangeRate
      ? Math.round(newMinor * exchangeRate) as Minor
      : newMinor;
    return {
      ...line,
      amountMinor: newMinor,
      mainCurrencyAmountMinor: mainMinor,
    };
  });
}
