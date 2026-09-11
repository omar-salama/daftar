import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { exchangeRateService } from '@/features/exchange-rates/ExchangeRateService';
import { useMainCurrency } from '@/features/settings/hooks/useSettings';
import { createTxVersion, useAppendTx, useLedger } from '@/features/ledger/hooks/useLedger';
import type { TxId, TxLine, TxType, TxVersion } from '@/kernel';
import { appendDigit, minorFromDigits, Minor, SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from '@/kernel/money';


import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, TextInput, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccountPickerModal } from './AccountPickerModal';
import { AmountDisplay } from './AmountDisplay';
import { DatePickerModal } from './DatePickerModal';
import { Keypad } from './Keypad';
import { TransactionEditor } from './TransactionEditor';
import { TxControls } from './TxControls';
import { TxTypeToggle } from './TxTypeToggle';

export function EntryScreen() {
  const { txId } = useLocalSearchParams<{ txId?: string }>();
  const { data: ledgerTxs } = useLedger();
  const { data: accounts = [] } = useAccounts();

  const tx = txId && ledgerTxs ? ledgerTxs.find(t => t.txId === txId) : undefined;

  return (
    <EntryForm
      key={txId ? `${txId}-${tx?.version}` : 'new'}
      editingTx={tx}
      editingTxId={txId}
      accounts={accounts}
    />
  );
}

function EntryForm({
  editingTx,
  editingTxId,
  accounts
}: {
  editingTx?: TxVersion;
  editingTxId?: string;
  accounts: NonNullable<ReturnType<typeof useAccounts>['data']>;
}) {
  const router = useRouter();
  const { data: mainCurrency = 'EGP' } = useMainCurrency();

  const [digits, setDigits] = useState(() => {
    if (!editingTx) return '';
    const isWhole = editingTx.totalMinor % 100 === 0;
    return isWhole ? (editingTx.totalMinor / 100).toString() : (editingTx.totalMinor / 100).toFixed(2);
  });
  const [date, setDate] = useState(() => editingTx?.occurredAt || new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showTransferAccountPicker, setShowTransferAccountPicker] = useState(false);
  const [accountId, setAccountId] = useState<string>(() => editingTx?.accountId || '');
  const [transferAccountId, setTransferAccountId] = useState<string>(() => editingTx?.transferAccountId || '');
  const [isSplit, setIsSplit] = useState(() => (editingTx?.lines?.length ?? 0) > 1);
  const [splitCategoryIds, setSplitCategoryIds] = useState<string[]>([]);
  const [txType, setTxType] = useState<TxType>(() => editingTx?.type ?? 'expense');
  const [showDetails, setShowDetails] = useState(() => !!(editingTx?.payee || editingTx?.note));
  const [payee, setPayee] = useState(() => editingTx?.payee || '');
  const [note, setNote] = useState(() => editingTx?.note || '');
  const [exchangeRateOverrideDigits, setExchangeRateOverrideDigits] = useState(() => editingTx?.exchangeRate ? editingTx.exchangeRate.toString() : '');
  
  // Cross-currency transfer
  const [transferDigits, setTransferDigits] = useState(() => {
    if (editingTx?.transferAmountMinor) {
      const isWhole = editingTx.transferAmountMinor % 100 === 0;
      return isWhole ? (editingTx.transferAmountMinor / 100).toString() : (editingTx.transferAmountMinor / 100).toFixed(2);
    }
    return '';
  });

  // Select default account if none is set
  useEffect(() => {
    if (!accountId && accounts && accounts.length > 0) {
      setAccountId(accounts.sort((a, b) => a.order - b.order)[0].accountId);
    }
  }, [accounts, accountId]);

  const amountMinor = minorFromDigits(digits);
  const appendTx = useAppendTx();

  const account = accounts.find(a => a.accountId === accountId);
  const transferAccount = accounts.find(a => a.accountId === transferAccountId);
  
  const fromCurrency = account?.currency || 'EGP';
  const currencyConfig = SUPPORTED_CURRENCIES[fromCurrency] || DEFAULT_CURRENCY;
  const toCurrency = transferAccount?.currency || fromCurrency;
  const isCrossCurrencyTransfer = txType === 'transfer' && fromCurrency !== toCurrency;

  const handleDigit = (d: string) => {
    setDigits(prev => appendDigit(prev, d));
  };

  const handleBackspace = () => {
    setDigits(prev => prev.slice(0, -1));
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

    const tx = createTxVersion({
      txId: editingTxId ? (editingTxId as TxId) : undefined,
      type: txType,
      occurredAt: date,
      accountId,
      transferAccountId: txType === 'transfer' ? transferAccountId : undefined,
      payee: payee || undefined,
      note: note || undefined,
      lines: processedLines,
      exchangeRate,
      transferAmountMinor,
      transferExchangeRate,
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
          <AmountDisplay amount={amountMinor} txType={txType} currencyConfig={currencyConfig} />
          
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
            onPressDate={() => setShowDatePicker(true)}
            onPressAccount={() => setShowAccountPicker(true)}
            onPressTransferAccount={() => setShowTransferAccountPicker(true)}
            onToggleDetails={() => setShowDetails(!showDetails)}
            onChangePayee={setPayee}
            onChangeNote={setNote}
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
    </SafeAreaView>
  );
}
