import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useRecurrenceRules } from '@/features/recurrence/hooks';
import { RecurrenceRule } from '@/kernel';
import { divideInstallments } from '@/kernel';
import type { TxVersion } from '@/kernel';

import { useLocalSearchParams } from 'expo-router';
import { TextInput, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLedger } from '@/features/ledger/hooks/useLedger';

import { useEntryForm } from '../hooks/useEntryForm';
import { useEntrySave } from '../hooks/useEntrySave';

import { AccountPickerModal } from './AccountPickerModal';
import { AmountDisplay } from './AmountDisplay';
import { DatePickerModal } from './DatePickerModal';
import { Keypad } from './Keypad';
import { TransactionEditor } from './TransactionEditor';
import { TxControls } from './TxControls';
import { TxTypeToggle } from './TxTypeToggle';
import { RecurrenceConfigModal } from './RecurrenceConfigModal';

export function EntryScreen() {
  const { txId, ruleId } = useLocalSearchParams<{ txId?: string, ruleId?: string }>();
  const { data: ledgerTxs } = useLedger();
  const { data: rules } = useRecurrenceRules();
  const { data: accounts = [] } = useAccounts();

  const tx = txId && ledgerTxs ? ledgerTxs.find(t => t.txId === txId) : undefined;
  const rule = ruleId && rules ? rules.find(r => r.recurrenceId === ruleId) : undefined;

  return (
    <EntryForm
      key={txId ? `${txId}-${tx?.version}` : ruleId ? `${ruleId}-${rule?.version}` : 'new'}
      editingTx={tx}
      editingTxId={txId}
      editingRule={rule}
      accounts={accounts}
    />
  );
}

function EntryForm({
  editingTx,
  editingTxId,
  editingRule,
  accounts,
}: {
  editingTx?: TxVersion;
  editingTxId?: string;
  editingRule?: RecurrenceRule;
  accounts: NonNullable<ReturnType<typeof useAccounts>['data']>;
}) {
  const {
    state,
    dispatch,
    mainCurrency,
    amountMinor,
    fromCurrency,
    toCurrency,
    currencyConfig,
    isCrossCurrencyTransfer,
    handleDigit,
    handleBackspace,
    handleToggleType,
  } = useEntryForm({ editingTx, editingRule, accounts });

  const { saveLines, handleSaveTransfer, handleSaveCategory } = useEntrySave({
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
  });

  const displayAmount = state.recurrenceMode === 'installment'
    ? divideInstallments(amountMinor, state.installmentCount)[0]
    : amountMinor;

  return (
    <SafeAreaView
      className="flex-1 bg-surface"
      edges={['top', 'left', 'right']}
    >
      <View className="flex-1 bg-surface gap-6">
        <TxTypeToggle txType={state.txType} onChangeType={handleToggleType} />
        <View className='px-6 gap-6'>
          <AmountDisplay
            amount={displayAmount}
            txType={state.txType}
            currencyConfig={currencyConfig}
            isInstallment={state.recurrenceMode === 'installment'}
            installmentCount={state.installmentCount}
            totalAmount={amountMinor}
          />

          {isCrossCurrencyTransfer && (
            <View className="bg-surface-container rounded-xl p-3 border border-surface-variant flex-row justify-between items-center">
              <Text className="text-on-surface-variant font-medium">To {toCurrency}:</Text>
              <TextInput
                className="text-on-surface text-lg text-right flex-1 ml-4"
                placeholder="0.00"
                placeholderTextColor="#71717a"
                value={state.transferDigits}
                onChangeText={(text) => dispatch({ type: 'SET_TRANSFER_DIGITS', digits: text })}
                keyboardType="decimal-pad"
              />
            </View>
          )}

          {fromCurrency !== mainCurrency && state.txType !== 'transfer' && (
            <View className="bg-surface-container rounded-xl p-3 border border-surface-variant flex-row justify-between items-center">
              <Text className="text-on-surface-variant font-medium">Rate ({fromCurrency} to {mainCurrency}):</Text>
              <TextInput
                className="text-on-surface text-lg text-right flex-1 ml-4"
                placeholder="Auto-fetch"
                placeholderTextColor="#71717a"
                value={state.exchangeRateOverrideDigits}
                onChangeText={(text) => dispatch({ type: 'SET_EXCHANGE_RATE', digits: text })}
                keyboardType="decimal-pad"
              />
            </View>
          )}

          <TxControls
            txType={state.txType}
            date={state.date}
            accountId={state.accountId}
            transferAccountId={state.transferAccountId}
            accounts={accounts}
            showDetails={state.showDetails}
            payee={state.payee}
            note={state.note}
            recurrenceMode={state.recurrenceMode}
            frequency={state.frequency}
            onPressDate={() => dispatch({ type: 'SHOW_MODAL', modal: 'datePicker' })}
            onPressAccount={() => dispatch({ type: 'SHOW_MODAL', modal: 'accountPicker' })}
            onPressTransferAccount={() => dispatch({ type: 'SHOW_MODAL', modal: 'transferAccountPicker' })}
            onToggleDetails={() => dispatch({ type: 'TOGGLE_DETAILS' })}
            onChangePayee={(val) => dispatch({ type: 'SET_PAYEE', payee: val })}
            onChangeNote={(val) => dispatch({ type: 'SET_NOTE', note: val })}
            onPressRecurrence={() => dispatch({ type: 'SHOW_MODAL', modal: 'recurrenceConfig' })}
          />
        </View>
        <View className="flex-1 justify-end p-2 gap-3">
          <TransactionEditor
            txType={state.txType}
            isSplit={state.isSplit}
            initialSplitCategoryIds={state.splitCategoryIds}
            amountMinor={amountMinor}
            transferAccountId={state.transferAccountId}
            initialLines={editingTx?.lines ?? editingRule?.lines}
            onSaveTransfer={handleSaveTransfer}
            onSaveLines={saveLines}
            onSetIsSplit={(split, ids) => {
              dispatch({ type: 'SET_SPLIT', isSplit: split, categoryIds: ids });
            }}
            onSaveCategory={handleSaveCategory}
          />

          {!state.isSplit && (
            <Keypad
              onDigit={handleDigit}
              onBackspace={handleBackspace}
            />
          )}
        </View>
      </View>

      <DatePickerModal
        visible={state.showDatePicker}
        currentDate={state.date}
        onClose={() => dispatch({ type: 'HIDE_MODAL', modal: 'datePicker' })}
        onSelectDate={(date) => dispatch({ type: 'SET_DATE', date })}
      />

      <AccountPickerModal
        visible={state.showAccountPicker}
        title="Select Account"
        accounts={accounts}
        onClose={() => dispatch({ type: 'HIDE_MODAL', modal: 'accountPicker' })}
        onSelectAccount={(id) => dispatch({ type: 'SET_ACCOUNT', accountId: id })}
      />

      <AccountPickerModal
        visible={state.showTransferAccountPicker}
        title="Select Destination Account"
        accounts={accounts.filter(a => a.accountId !== state.accountId)}
        onClose={() => dispatch({ type: 'HIDE_MODAL', modal: 'transferAccountPicker' })}
        onSelectAccount={(id) => dispatch({ type: 'SET_TRANSFER_ACCOUNT', accountId: id })}
      />

      <RecurrenceConfigModal
        visible={state.showRecurrenceConfig}
        mode={state.recurrenceMode}
        frequency={state.frequency}
        installmentCount={state.installmentCount}
        onClose={() => dispatch({ type: 'HIDE_MODAL', modal: 'recurrenceConfig' })}
        onConfirm={(config) => {
          dispatch({
            type: 'SET_RECURRENCE',
            mode: config.mode,
            frequency: config.frequency,
            installmentCount: config.mode === 'installment' ? config.installmentCount : undefined,
          });
          dispatch({ type: 'HIDE_MODAL', modal: 'recurrenceConfig' });
        }}
      />
    </SafeAreaView>
  );
}
