import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useRecurrenceRules } from '@/features/recurrence/hooks';
import { RecurrenceRule } from '@/kernel';
import { exchangeRateService } from '@/features/exchange-rates/ExchangeRateService';
import { useMainCurrency } from '@/features/settings/hooks/useSettings';
import { createTxVersion, useAppendTx, useLedger } from '@/features/ledger/hooks/useLedger';
import { createRecurrenceRule, useAppendRecurrenceRule } from '@/features/recurrence/hooks/useRecurrenceRules';
import type { TxId, TxLine, TxType, TxVersion } from '@/kernel';
import { divideInstallments, RecurrenceMode, RecurrenceFrequency, getBillingCycle } from '@/kernel';
import { appendDigit, minorFromDigits, Minor, SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from '@/kernel/money';


import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { Alert, TextInput, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  accounts
}: {
  editingTx?: TxVersion;
  editingTxId?: string;
  editingRule?: RecurrenceRule;
  accounts: NonNullable<ReturnType<typeof useAccounts>['data']>;
}) {
  const router = useRouter();
  const { data: mainCurrency = 'EGP' } = useMainCurrency();

  const initialState = useMemo(() => {
    const defaultDate = new Date().toISOString().split('T')[0];
    
    if (editingRule) {
      const amt = editingRule.mode === 'installment' 
        ? (editingRule.originalTotalMinor || editingRule.totalMinor) 
        : editingRule.totalMinor;
      return {
        digits: amt % 100 === 0 ? (amt / 100).toString() : (amt / 100).toFixed(2),
        date: editingRule.startDate,
        accountId: editingRule.accountId,
        transferAccountId: editingRule.transferAccountId || '',
        isSplit: editingRule.lines.length > 1,
        txType: editingRule.type,
        payee: editingRule.payee || '',
        note: editingRule.note || '',
        exchangeRate: editingRule.exchangeRate?.toString() || '',
        recurrenceMode: editingRule.mode,
        frequency: editingRule.frequency || 'monthly',
        installmentCount: editingRule.totalInstallments || 12,
        transferDigits: '',
      };
    }
    
    if (editingTx) {
      const amt = editingTx.totalMinor;
      let tDigits = '';
      if (editingTx.transferAmountMinor) {
        tDigits = editingTx.transferAmountMinor % 100 === 0 
          ? (editingTx.transferAmountMinor / 100).toString() 
          : (editingTx.transferAmountMinor / 100).toFixed(2);
      }
      return {
        digits: amt % 100 === 0 ? (amt / 100).toString() : (amt / 100).toFixed(2),
        date: editingTx.occurredAt,
        accountId: editingTx.accountId,
        transferAccountId: editingTx.transferAccountId || '',
        isSplit: editingTx.lines.length > 1,
        txType: editingTx.type,
        payee: editingTx.payee || '',
        note: editingTx.note || '',
        exchangeRate: editingTx.exchangeRate?.toString() || '',
        recurrenceMode: 'none' as const,
        frequency: 'monthly' as const,
        installmentCount: 12,
        transferDigits: tDigits,
      };
    }
    
    return {
      digits: '',
      date: defaultDate,
      accountId: '',
      transferAccountId: '',
      isSplit: false,
      txType: 'expense' as TxType,
      payee: '',
      note: '',
      exchangeRate: '',
      recurrenceMode: 'none' as const,
      frequency: 'monthly' as const,
      installmentCount: 12,
      transferDigits: '',
    };
  }, [editingTx, editingRule]);

  const [digits, setDigits] = useState(initialState.digits);
  const [date, setDate] = useState(initialState.date);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showTransferAccountPicker, setShowTransferAccountPicker] = useState(false);
  const [accountId, setAccountId] = useState(initialState.accountId);
  const [transferAccountId, setTransferAccountId] = useState(initialState.transferAccountId);
  const [isSplit, setIsSplit] = useState(initialState.isSplit);
  const [splitCategoryIds, setSplitCategoryIds] = useState<string[]>([]);
  const [txType, setTxType] = useState<TxType>(initialState.txType);
  const [showDetails, setShowDetails] = useState(() => !!(initialState.payee || initialState.note));
  const [payee, setPayee] = useState(initialState.payee);
  const [note, setNote] = useState(initialState.note);
  const [exchangeRateOverrideDigits, setExchangeRateOverrideDigits] = useState(initialState.exchangeRate);

  const [recurrenceMode, setRecurrenceMode] = useState<RecurrenceMode | 'none'>(initialState.recurrenceMode);
  const [frequency, setFrequency] = useState<RecurrenceFrequency | 'none'>(initialState.frequency as RecurrenceFrequency | 'none');
  const [installmentCount, setInstallmentCount] = useState(initialState.installmentCount);
  const [showRecurrenceConfig, setShowRecurrenceConfig] = useState(false);
  
  // Cross-currency transfer
  const [transferDigits, setTransferDigits] = useState(initialState.transferDigits);

  // Select default account if none is set
  useEffect(() => {
    if (!accountId && accounts && accounts.length > 0) {
      setAccountId(accounts.sort((a, b) => a.order - b.order)[0].accountId);
    }
  }, [accounts, accountId]);

  const amountMinor = minorFromDigits(digits);
  const appendTx = useAppendTx();
  const appendRecurrenceRule = useAppendRecurrenceRule();

  const account = accounts.find(a => a.accountId === accountId);
  const transferAccount = accounts.find(a => a.accountId === transferAccountId);
  
  const fromCurrency = account?.currency || 'EGP';
  const currencyConfig = SUPPORTED_CURRENCIES[fromCurrency] || DEFAULT_CURRENCY;
  const toCurrency = transferAccount?.currency || fromCurrency;
  const isCrossCurrencyTransfer = txType === 'transfer' && fromCurrency !== toCurrency;

  const handleDigit = (d: string) => {
    setDigits((prev: string) => appendDigit(prev, d));
  };

  const handleBackspace = () => {
    setDigits((prev: string) => prev.slice(0, -1));
  };

  const saveLines = async (lines: TxLine[]) => {
    if (amountMinor === 0) return;
    
    if (isCrossCurrencyTransfer && !transferDigits) {
      Alert.alert('Missing amount', `Please enter the destination amount in ${toCurrency}`);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    let exchangeRate: number | undefined;
    if (fromCurrency !== mainCurrency) {
      if (exchangeRateOverrideDigits && !isNaN(Number(exchangeRateOverrideDigits))) {
        exchangeRate = Number(exchangeRateOverrideDigits);
      } else {
        try {
          exchangeRate = await exchangeRateService.getRate(fromCurrency, mainCurrency, date);
        } catch {
          Alert.alert('Network Error', `Could not fetch exchange rate for ${fromCurrency} to ${mainCurrency}. Please enter a manual rate.`);
          return;
        }
      }
    }

    const processedLines = lines.map(line => {
      const mainMinor = exchangeRate 
        ? Math.round(line.amountMinor * exchangeRate) as Minor 
        : line.amountMinor;
      return {
        ...line,
        mainCurrencyAmountMinor: mainMinor
      };
    });

    let transferAmountMinor: Minor | undefined;
    let transferExchangeRate: number | undefined;
    
    if (txType === 'transfer' && transferAccountId) {
      if (isCrossCurrencyTransfer) {
        transferAmountMinor = minorFromDigits(transferDigits);
        transferExchangeRate = transferAmountMinor / amountMinor;
      } else {
        transferAmountMinor = amountMinor;
        transferExchangeRate = 1;
      }
    }

    let txLines = processedLines;
    let txAmount = amountMinor;
    let originalTotalMinor: Minor | undefined = undefined;

    if (recurrenceMode === 'installment') {
      const installments = divideInstallments(amountMinor, installmentCount);
      txAmount = installments[0];
      txLines = processedLines.map(line => {
        if (line.amountMinor === amountMinor) {
          return { ...line, amountMinor: txAmount, mainCurrencyAmountMinor: exchangeRate ? Math.round(txAmount * exchangeRate) as Minor : txAmount };
        }
        // Simplified proportion logic for split lines in installments
        const ratio = line.amountMinor / amountMinor;
        const newMinor = Math.round(txAmount * ratio) as Minor;
        return { ...line, amountMinor: newMinor, mainCurrencyAmountMinor: exchangeRate ? Math.round(newMinor * exchangeRate) as Minor : newMinor };
      });
      originalTotalMinor = amountMinor;
    }

    let computedDate = date;

    if (recurrenceMode === 'installment') {
      const selectedAccount = accounts.find((a) => a.accountId === accountId);
      if (selectedAccount?.billingCycleStartDay && selectedAccount?.paymentDay) {
        const cycle = getBillingCycle(
          selectedAccount.billingCycleStartDay,
          date,
          selectedAccount.paymentDay
        );
        if (cycle.paymentDate) {
          computedDate = cycle.paymentDate;
        }
      }
    }

    const baseTx = {
      type: txType,
      occurredAt: computedDate,
      accountId,
      transferAccountId: txType === 'transfer' ? transferAccountId : undefined,
      payee: payee || undefined,
      note: note || undefined,
      lines: txLines,
      exchangeRate,
      transferAmountMinor,
      transferExchangeRate,
    };

    if (editingRule) {
      // We are strictly editing a rule, not a transaction.
      const updatedRule = createRecurrenceRule({
        ...editingRule,
        mode: recurrenceMode as RecurrenceMode,
        type: txType,
        accountId,
        transferAccountId: txType === 'transfer' ? transferAccountId : undefined,
        lines: txLines,
        payee: payee || undefined,
        note: note || undefined,
        exchangeRate,
        frequency: frequency as RecurrenceFrequency,
        totalInstallments: recurrenceMode === 'installment' ? installmentCount : undefined,
        originalTotalMinor: originalTotalMinor,
        // we keep the start date and materialize count unchanged!
      });
      appendRecurrenceRule.mutate(updatedRule, {
        onSuccess: () => router.back()
      });
      return;
    }

    let recurrenceId: string | undefined;

    if (recurrenceMode !== 'none') {
      const rule = createRecurrenceRule({
        mode: recurrenceMode as RecurrenceMode,
        type: txType,
        accountId,
        transferAccountId: txType === 'transfer' ? transferAccountId : undefined,
        lines: txLines,
        payee: payee || undefined,
        note: note || undefined,
        exchangeRate,
        frequency: frequency as RecurrenceFrequency,
        startDate: computedDate,
        totalInstallments: recurrenceMode === 'installment' ? installmentCount : undefined,
        originalTotalMinor: originalTotalMinor,
        lastMaterializedDate: computedDate,
        materializedCount: 1,
      });
      recurrenceId = rule.recurrenceId;
      appendRecurrenceRule.mutate(rule);
    }

    const tx = createTxVersion({
      ...baseTx,
      txId: editingTxId ? (editingTxId as TxId) : undefined,
      recurrenceId,
      installmentNumber: recurrenceMode === 'installment' ? 1 : undefined,
      totalInstallments: recurrenceMode === 'installment' ? installmentCount : undefined,
    });

    appendTx.mutate(tx, {
      onSuccess: () => {
        setDigits('');
        setTransferDigits('');
        setPayee('');
        setNote('');
        setIsSplit(false);
        setSplitCategoryIds([]);
        setTxType('expense');
        setRecurrenceMode('none');
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
      }
    });
  };

  const handleSaveTransfer = () => {
    if (!transferAccountId) {
      Alert.alert('Missing account', 'Please select a transfer destination account');
      return;
    }
    saveLines([{ categoryId: 'transfer', amountMinor }]);
  };

  const handleSaveCategory = (categoryId: string) => {
    saveLines([{ categoryId, amountMinor }]);
  };

  const handleToggleType = (type: TxType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTxType(type);
  };

  return (
    <SafeAreaView
      className="flex-1 bg-surface"
      edges={['top', 'left', 'right']}
    >
      <View className="flex-1 bg-surface gap-6">
        <TxTypeToggle txType={txType} onChangeType={handleToggleType} />
        <View className='px-6 gap-6'>
          <AmountDisplay 
            amount={recurrenceMode === 'installment' ? divideInstallments(amountMinor, installmentCount)[0] : amountMinor} 
            txType={txType} 
            currencyConfig={currencyConfig} 
            isInstallment={recurrenceMode === 'installment'}
            installmentCount={installmentCount}
            totalAmount={amountMinor}
          />
          
          {isCrossCurrencyTransfer && (
            <View className="bg-surface-container rounded-xl p-3 border border-surface-variant flex-row justify-between items-center">
              <Text className="text-on-surface-variant font-medium">To {toCurrency}:</Text>
              <TextInput
                className="text-on-surface text-lg text-right flex-1 ml-4"
                placeholder="0.00"
                placeholderTextColor="#71717a"
                value={transferDigits}
                onChangeText={setTransferDigits}
                keyboardType="decimal-pad"
              />
            </View>
          )}

          {fromCurrency !== mainCurrency && txType !== 'transfer' && (
            <View className="bg-surface-container rounded-xl p-3 border border-surface-variant flex-row justify-between items-center">
              <Text className="text-on-surface-variant font-medium">Rate ({fromCurrency} to {mainCurrency}):</Text>
              <TextInput
                className="text-on-surface text-lg text-right flex-1 ml-4"
                placeholder="Auto-fetch"
                placeholderTextColor="#71717a"
                value={exchangeRateOverrideDigits}
                onChangeText={setExchangeRateOverrideDigits}
                keyboardType="decimal-pad"
              />
            </View>
          )}

          <TxControls
            txType={txType}
            date={date}
            accountId={accountId}
            transferAccountId={transferAccountId}
            accounts={accounts}
            showDetails={showDetails}
            payee={payee}
            note={note}
            recurrenceMode={recurrenceMode}
        frequency={frequency}
            onPressDate={() => setShowDatePicker(true)}
            onPressAccount={() => setShowAccountPicker(true)}
            onPressTransferAccount={() => setShowTransferAccountPicker(true)}
            onToggleDetails={() => setShowDetails(!showDetails)}
            onChangePayee={setPayee}
            onChangeNote={setNote}
            onPressRecurrence={() => setShowRecurrenceConfig(true)}
          />
        </View>
        <View className="flex-1 justify-end p-2 gap-3">
          <TransactionEditor
            txType={txType}
            isSplit={isSplit}
            initialSplitCategoryIds={splitCategoryIds}
            amountMinor={amountMinor}
            transferAccountId={transferAccountId}
            editingTx={editingTx}
            onSaveTransfer={handleSaveTransfer}
            onSaveLines={saveLines}
            onSetIsSplit={(split, ids) => {
              setIsSplit(split);
              if (ids) setSplitCategoryIds(ids);
            }}
            onSaveCategory={handleSaveCategory}
          />

          {!isSplit && (
            <Keypad
              onDigit={handleDigit}
              onBackspace={handleBackspace}
            />
          )}
        </View>
      </View>

      <DatePickerModal
        visible={showDatePicker}
        currentDate={date}
        onClose={() => setShowDatePicker(false)}
        onSelectDate={setDate}
      />

      <AccountPickerModal
        visible={showAccountPicker}
        title="Select Account"
        accounts={accounts}
        onClose={() => setShowAccountPicker(false)}
        onSelectAccount={setAccountId}
      />

      <AccountPickerModal
        visible={showTransferAccountPicker}
        title="Select Destination Account"
        accounts={accounts.filter(a => a.accountId !== accountId)}
        onClose={() => setShowTransferAccountPicker(false)}
        onSelectAccount={setTransferAccountId}
      />

      <RecurrenceConfigModal
        visible={showRecurrenceConfig}
        mode={recurrenceMode}
        frequency={frequency}
        installmentCount={installmentCount}
        onClose={() => setShowRecurrenceConfig(false)}
        onConfirm={(config) => {
          setRecurrenceMode(config.mode);
          setFrequency(config.frequency);
          if (config.mode === 'installment') {
            setInstallmentCount(config.installmentCount);
          }
          setShowRecurrenceConfig(false);
        }}
      />
    </SafeAreaView>
  );
}
