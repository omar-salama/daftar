import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { RecurrenceRule } from '@/kernel';
import { useMainCurrency } from '@/features/settings/hooks/useSettings';
import type { TxType, TxVersion } from '@/kernel';
import { RecurrenceMode, RecurrenceFrequency } from '@/kernel';
import { appendDigit, minorFromDigits, SUPPORTED_CURRENCIES, DEFAULT_CURRENCY, DEFAULT_CURRENCY_CODE, digitsFromMinor } from '@/kernel/money';

import * as Haptics from 'expo-haptics';
import { useEffect, useReducer, useMemo } from 'react';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface EntryFormState {
  digits: string;
  date: string;
  accountId: string;
  transferAccountId: string;
  isSplit: boolean;
  splitCategoryIds: string[];
  txType: TxType;
  showDetails: boolean;
  payee: string;
  note: string;
  exchangeRateOverrideDigits: string;
  recurrenceMode: RecurrenceMode | 'none';
  frequency: RecurrenceFrequency | 'none';
  installmentCount: number;
  transferDigits: string;

  // Modal visibility
  showDatePicker: boolean;
  showAccountPicker: boolean;
  showTransferAccountPicker: boolean;
  showRecurrenceConfig: boolean;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type EntryFormAction =
  | { type: 'DIGIT'; digit: string }
  | { type: 'BACKSPACE' }
  | { type: 'SET_DATE'; date: string }
  | { type: 'SET_ACCOUNT'; accountId: string }
  | { type: 'SET_TRANSFER_ACCOUNT'; accountId: string }
  | { type: 'SET_TX_TYPE'; txType: TxType }
  | { type: 'SET_PAYEE'; payee: string }
  | { type: 'SET_NOTE'; note: string }
  | { type: 'SET_EXCHANGE_RATE'; digits: string }
  | { type: 'SET_TRANSFER_DIGITS'; digits: string }
  | { type: 'SET_SPLIT'; isSplit: boolean; categoryIds?: string[] }
  | { type: 'SET_RECURRENCE'; mode: RecurrenceMode | 'none'; frequency: RecurrenceFrequency | 'none'; installmentCount?: number }
  | { type: 'TOGGLE_DETAILS' }
  | { type: 'SHOW_MODAL'; modal: 'datePicker' | 'accountPicker' | 'transferAccountPicker' | 'recurrenceConfig' }
  | { type: 'HIDE_MODAL'; modal: 'datePicker' | 'accountPicker' | 'transferAccountPicker' | 'recurrenceConfig' }
  | { type: 'RESET' };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

const MODAL_KEY_MAP = {
  datePicker: 'showDatePicker',
  accountPicker: 'showAccountPicker',
  transferAccountPicker: 'showTransferAccountPicker',
  recurrenceConfig: 'showRecurrenceConfig',
} as const;

function entryFormReducer(state: EntryFormState, action: EntryFormAction): EntryFormState {
  switch (action.type) {
    case 'DIGIT':
      return { ...state, digits: appendDigit(state.digits, action.digit) };
    case 'BACKSPACE':
      return { ...state, digits: state.digits.slice(0, -1) };
    case 'SET_DATE':
      return { ...state, date: action.date };
    case 'SET_ACCOUNT':
      return { ...state, accountId: action.accountId };
    case 'SET_TRANSFER_ACCOUNT':
      return { ...state, transferAccountId: action.accountId };
    case 'SET_TX_TYPE':
      return { ...state, txType: action.txType };
    case 'SET_PAYEE':
      return { ...state, payee: action.payee };
    case 'SET_NOTE':
      return { ...state, note: action.note };
    case 'SET_EXCHANGE_RATE':
      return { ...state, exchangeRateOverrideDigits: action.digits };
    case 'SET_TRANSFER_DIGITS':
      return { ...state, transferDigits: action.digits };
    case 'SET_SPLIT':
      return {
        ...state,
        isSplit: action.isSplit,
        splitCategoryIds: action.categoryIds ?? (action.isSplit ? state.splitCategoryIds : []),
      };
    case 'SET_RECURRENCE':
      return {
        ...state,
        recurrenceMode: action.mode,
        frequency: action.frequency,
        installmentCount: action.installmentCount ?? state.installmentCount,
      };
    case 'TOGGLE_DETAILS':
      return { ...state, showDetails: !state.showDetails };
    case 'SHOW_MODAL':
      return { ...state, [MODAL_KEY_MAP[action.modal]]: true };
    case 'HIDE_MODAL':
      return { ...state, [MODAL_KEY_MAP[action.modal]]: false };
    case 'RESET':
      return {
        ...state,
        digits: '',
        transferDigits: '',
        payee: '',
        note: '',
        isSplit: false,
        splitCategoryIds: [],
        txType: 'expense',
        recurrenceMode: 'none',
      };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Initial state builder
// ---------------------------------------------------------------------------

export function buildInitialState(
  editingTx?: TxVersion,
  editingRule?: RecurrenceRule,
): EntryFormState {
  const defaultDate = new Date().toISOString().split('T')[0];

  const base: EntryFormState = {
    digits: '',
    date: defaultDate,
    accountId: '',
    transferAccountId: '',
    isSplit: false,
    splitCategoryIds: [],
    txType: 'expense',
    showDetails: false,
    payee: '',
    note: '',
    exchangeRateOverrideDigits: '',
    recurrenceMode: 'none',
    frequency: 'monthly',
    installmentCount: 12,
    transferDigits: '',
    showDatePicker: false,
    showAccountPicker: false,
    showTransferAccountPicker: false,
    showRecurrenceConfig: false,
  };

  if (editingRule) {
    const amt = editingRule.mode === 'installment'
      ? (editingRule.originalTotalMinor || editingRule.totalMinor)
      : editingRule.totalMinor;
    return {
      ...base,
      digits: digitsFromMinor(amt),
      date: editingRule.startDate,
      accountId: editingRule.accountId,
      transferAccountId: editingRule.transferAccountId || '',
      isSplit: editingRule.lines.length > 1,
      txType: editingRule.type,
      payee: editingRule.payee || '',
      note: editingRule.note || '',
      showDetails: !!(editingRule.payee || editingRule.note),
      exchangeRateOverrideDigits: editingRule.exchangeRate?.toString() || '',
      recurrenceMode: editingRule.mode,
      frequency: editingRule.frequency || 'monthly',
      installmentCount: editingRule.totalInstallments || 12,
    };
  }

  if (editingTx) {
    const amt = editingTx.totalMinor;
    const tDigits = editingTx.transferAmountMinor
      ? digitsFromMinor(editingTx.transferAmountMinor)
      : '';
    return {
      ...base,
      digits: digitsFromMinor(amt),
      date: editingTx.occurredAt,
      accountId: editingTx.accountId,
      transferAccountId: editingTx.transferAccountId || '',
      isSplit: editingTx.lines.length > 1,
      txType: editingTx.type,
      payee: editingTx.payee || '',
      note: editingTx.note || '',
      showDetails: !!(editingTx.payee || editingTx.note),
      exchangeRateOverrideDigits: editingTx.exchangeRate?.toString() || '',
      recurrenceMode: 'none',
      frequency: 'monthly',
      installmentCount: 12,
      transferDigits: tDigits,
    };
  }

  return base;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseEntryFormOptions {
  editingTx?: TxVersion;
  editingRule?: RecurrenceRule;
  accounts: NonNullable<ReturnType<typeof useAccounts>['data']>;
}

export function useEntryForm({ editingTx, editingRule, accounts }: UseEntryFormOptions) {
  const { data: mainCurrency = DEFAULT_CURRENCY_CODE } = useMainCurrency();

  const initialState = useMemo(
    () => buildInitialState(editingTx, editingRule),
    [editingTx, editingRule],
  );

  const [state, dispatch] = useReducer(entryFormReducer, initialState);

  // Select default account if none is set
  useEffect(() => {
    if (!state.accountId && accounts && accounts.length > 0) {
      const sorted = [...accounts].sort((a, b) => a.order - b.order);
      dispatch({ type: 'SET_ACCOUNT', accountId: sorted[0].accountId });
    }
  }, [accounts, state.accountId]);

  // Derived values
  const amountMinor = minorFromDigits(state.digits);

  const account = accounts.find(a => a.accountId === state.accountId);
  const transferAccount = accounts.find(a => a.accountId === state.transferAccountId);

  const fromCurrency = account?.currency || DEFAULT_CURRENCY_CODE;
  const currencyConfig = SUPPORTED_CURRENCIES[fromCurrency] || DEFAULT_CURRENCY;
  const toCurrency = transferAccount?.currency || fromCurrency;
  const isCrossCurrencyTransfer = state.txType === 'transfer' && fromCurrency !== toCurrency;

  // Action helpers
  const handleDigit = (d: string) => dispatch({ type: 'DIGIT', digit: d });
  const handleBackspace = () => dispatch({ type: 'BACKSPACE' });
  const handleToggleType = (txType: TxType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({ type: 'SET_TX_TYPE', txType });
  };

  return {
    state,
    dispatch,
    mainCurrency,
    amountMinor,
    account,
    transferAccount,
    fromCurrency,
    toCurrency,
    currencyConfig,
    isCrossCurrencyTransfer,
    handleDigit,
    handleBackspace,
    handleToggleType,
  };
}
