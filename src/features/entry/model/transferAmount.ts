import type { Minor } from '@/kernel/money';
import { minorFromDigits } from '@/kernel/money';

export interface TransferAmountResult {
  transferAmountMinor: Minor;
  transferExchangeRate: number;
}

/**
 * Resolve the transfer amount and exchange rate for a transfer transaction.
 */
export function resolveTransferAmount(
  amountMinor: Minor,
  transferDigits: string,
  isCrossCurrency: boolean
): TransferAmountResult {
  if (isCrossCurrency) {
    const transferAmountMinor = minorFromDigits(transferDigits);
    return {
      transferAmountMinor,
      transferExchangeRate: transferAmountMinor / amountMinor,
    };
  }
  return {
    transferAmountMinor: amountMinor,
    transferExchangeRate: 1,
  };
}
