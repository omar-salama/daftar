import type { RecurrenceRule, TxId, TxLine } from '@/kernel';
import { divideInstallments, RecurrenceMode, RecurrenceFrequency } from '@/kernel';
import type { Minor } from '@/kernel/money';
import { exchangeRateService } from '@/features/exchange-rates/ExchangeRateService';
import { createTxVersion, useAppendTx } from '@/features/ledger/hooks/useLedger';
import { createRecurrenceRule, useAppendRecurrenceRule } from '@/features/recurrence/hooks/useRecurrenceRules';
import {
  computeMainCurrencyLines,
  proportionLinesForInstallment,
  resolveTransferAmount,
  resolveInstallmentDate,
} from '../model';

import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import type { EntryFormState, EntryFormAction } from './useEntryForm';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseEntrySaveOptions {
  state: EntryFormState;
  dispatch: React.Dispatch<EntryFormAction>;
  amountMinor: Minor;
  fromCurrency: string;
  toCurrency: string;
  mainCurrency: string;
  isCrossCurrencyTransfer: boolean;
  accounts: { accountId: string; billingCycleStartDay?: number; paymentDay?: number }[];
  editingTxId?: string;
  editingRule?: RecurrenceRule;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useEntrySave({
  state,
  dispatch,
  amountMinor,
  fromCurrency,
  toCurrency,
  mainCurrency,
  isCrossCurrencyTransfer,
  accounts,
  editingTxId,
  editingRule,
}: UseEntrySaveOptions) {
  const router = useRouter();
  const appendTx = useAppendTx();
  const appendRecurrenceRule = useAppendRecurrenceRule();

  // -----------------------------------------------------------------------
  // Core save
  // -----------------------------------------------------------------------

  const saveLines = async (lines: TxLine[]) => {
    if (amountMinor === 0) return;

    if (isCrossCurrencyTransfer && !state.transferDigits) {
      Alert.alert('Missing amount', `Please enter the destination amount in ${toCurrency}`);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // --- Exchange rate resolution ---
    let exchangeRate: number | undefined;
    if (fromCurrency !== mainCurrency) {
      if (state.exchangeRateOverrideDigits && !isNaN(Number(state.exchangeRateOverrideDigits))) {
        exchangeRate = Number(state.exchangeRateOverrideDigits);
      } else {
        try {
          exchangeRate = await exchangeRateService.getRate(fromCurrency, mainCurrency, state.date);
        } catch {
          Alert.alert('Network Error', `Could not fetch exchange rate for ${fromCurrency} to ${mainCurrency}. Please enter a manual rate.`);
          return;
        }
      }
    }

    // --- Line processing ---
    let processedLines = computeMainCurrencyLines(lines, exchangeRate);

    // --- Transfer amount ---
    let transferAmountMinor: Minor | undefined;
    let transferExchangeRate: number | undefined;

    if (state.txType === 'transfer' && state.transferAccountId) {
      const result = resolveTransferAmount(amountMinor, state.transferDigits, isCrossCurrencyTransfer);
      transferAmountMinor = result.transferAmountMinor;
      transferExchangeRate = result.transferExchangeRate;
    }

    // --- Installment processing ---
    let txAmount = amountMinor;
    let originalTotalMinor: Minor | undefined = undefined;

    if (state.recurrenceMode === 'installment') {
      const installments = divideInstallments(amountMinor, state.installmentCount);
      txAmount = installments[0];
      processedLines = proportionLinesForInstallment(processedLines, amountMinor, txAmount, exchangeRate);
      originalTotalMinor = amountMinor;
    }

    // --- Date resolution ---
    let computedDate = state.date;
    if (state.recurrenceMode === 'installment') {
      computedDate = resolveInstallmentDate(state.date, state.accountId, accounts);
    }

    // --- Build base tx fields ---
    const baseTx = {
      type: state.txType,
      occurredAt: computedDate,
      accountId: state.accountId,
      transferAccountId: state.txType === 'transfer' ? state.transferAccountId : undefined,
      payee: state.payee || undefined,
      note: state.note || undefined,
      lines: processedLines,
      exchangeRate,
      transferAmountMinor,
      transferExchangeRate,
    };

    // --- Rule editing ---
    if (editingRule) {
      const updatedRule = createRecurrenceRule({
        ...editingRule,
        mode: state.recurrenceMode as RecurrenceMode,
        type: state.txType,
        accountId: state.accountId,
        transferAccountId: state.txType === 'transfer' ? state.transferAccountId : undefined,
        lines: processedLines,
        payee: state.payee || undefined,
        note: state.note || undefined,
        exchangeRate,
        frequency: state.frequency as RecurrenceFrequency,
        totalInstallments: state.recurrenceMode === 'installment' ? state.installmentCount : undefined,
        originalTotalMinor: originalTotalMinor,
      });
      appendRecurrenceRule.mutate(updatedRule, {
        onSuccess: () => router.back(),
      });
      return;
    }

    // --- New recurrence rule ---
    let recurrenceId: string | undefined;
    if (state.recurrenceMode !== 'none') {
      const rule = createRecurrenceRule({
        mode: state.recurrenceMode as RecurrenceMode,
        type: state.txType,
        accountId: state.accountId,
        transferAccountId: state.txType === 'transfer' ? state.transferAccountId : undefined,
        lines: processedLines,
        payee: state.payee || undefined,
        note: state.note || undefined,
        exchangeRate,
        frequency: state.frequency as RecurrenceFrequency,
        startDate: computedDate,
        totalInstallments: state.recurrenceMode === 'installment' ? state.installmentCount : undefined,
        originalTotalMinor: originalTotalMinor,
        lastMaterializedDate: computedDate,
        materializedCount: 1,
      });
      recurrenceId = rule.recurrenceId;
      appendRecurrenceRule.mutate(rule);
    }

    // --- Save transaction ---
    const tx = createTxVersion({
      ...baseTx,
      txId: editingTxId ? (editingTxId as TxId) : undefined,
      recurrenceId,
      installmentNumber: state.recurrenceMode === 'installment' ? 1 : undefined,
      totalInstallments: state.recurrenceMode === 'installment' ? state.installmentCount : undefined,
    });

    appendTx.mutate(tx, {
      onSuccess: () => {
        dispatch({ type: 'RESET' });
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
      },
    });
  };

  // -----------------------------------------------------------------------
  // Convenience wrappers
  // -----------------------------------------------------------------------

  const handleSaveTransfer = () => {
    if (!state.transferAccountId) {
      Alert.alert('Missing account', 'Please select a transfer destination account');
      return;
    }
    saveLines([{ categoryId: 'transfer', amountMinor }]);
  };

  const handleSaveCategory = (categoryId: string) => {
    saveLines([{ categoryId, amountMinor }]);
  };

  return {
    saveLines,
    handleSaveTransfer,
    handleSaveCategory,
  };
}
