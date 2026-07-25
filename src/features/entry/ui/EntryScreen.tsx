import { useAppendTx, useCreateTx, useLedger } from '@/features/ledger/hooks/useLedger';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import type { TxId, TxLine, TxType, TxVersion } from '@/kernel';
import { minorFromDigits } from '@/kernel/money';

import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmountDisplay } from './AmountDisplay';
import { CategoryGrid } from './CategoryGrid';
import { Keypad } from './Keypad';
import { SplitEditor } from './SplitEditor';

export function EntryScreen() {
  const { txId } = useLocalSearchParams<{ txId?: string }>();
  const { data: ledgerTxs } = useLedger();
  const { data: accounts = [] } = useAccounts();
  
  const tx = txId && ledgerTxs ? ledgerTxs.find(t => t.txId === txId) : undefined;

  return (
    <EntryForm 
      key={txId || 'new'} 
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
  accounts: NonNullable<ReturnType<typeof useAccounts>['data']>
}) {
  const router = useRouter();
  
  const [digits, setDigits] = useState(() => {
    if (!editingTx) return '';
    const isWhole = editingTx.totalMinor % 100 === 0;
    return isWhole ? (editingTx.totalMinor / 100).toString() : (editingTx.totalMinor / 100).toFixed(2);
  });
  const [date, setDate] = useState(() => editingTx?.occurredAt || new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [accountId, setAccountId] = useState<string>(() => editingTx?.accountId || '');
  const [isSplit, setIsSplit] = useState(() => (editingTx?.lines?.length ?? 0) > 1);
  const [txType, setTxType] = useState<TxType>(() => editingTx?.type ?? 'expense');
  const [showDetails, setShowDetails] = useState(() => !!(editingTx?.payee || editingTx?.note));
  const [payee, setPayee] = useState(() => editingTx?.payee || '');
  const [note, setNote] = useState(() => editingTx?.note || '');

  // Select default account if none is set
  useEffect(() => {
    if (!accountId && accounts && accounts.length > 0) {
      setAccountId(accounts.sort((a, b) => a.order - b.order)[0].accountId);
    }
  }, [accounts, accountId]);

  const amountMinor = minorFromDigits(digits);
  
  const appendTx = useAppendTx();
  const createTx = useCreateTx();

  const handleDigit = (d: string) => {
    if (d === '.') {
      if (!digits.includes('.')) {
        setDigits(prev => (prev === '' ? '0.' : prev + '.'));
      }
      return;
    }
    
    if (digits.includes('.')) {
      const parts = digits.split('.');
      if (parts[1] && parts[1].length >= 2) return;
    }

    if (digits.length < 10) {
      setDigits(prev => prev + d);
    }
  };

  const handleBackspace = () => {
    setDigits(prev => prev.slice(0, -1));
  };

  const getQuickDates = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const dayBefore = new Date(today);
    dayBefore.setDate(today.getDate() - 2);

    return [
      { label: 'Today', value: today.toISOString().split('T')[0] },
      { label: 'Yesterday', value: yesterday.toISOString().split('T')[0] },
      { label: dayBefore.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), value: dayBefore.toISOString().split('T')[0] },
    ];
  };

  const saveLines = (lines: TxLine[]) => {
    if (amountMinor === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // UUID from crypto fallback or expo
    let uuidStr: string;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      uuidStr = crypto.randomUUID();
    } else {
      uuidStr = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }

    const tx = createTx({
      txId: (editingTxId || uuidStr) as TxId,
      type: txType,
      occurredAt: date,
      accountId,
      payee: payee || undefined,
      note: note || undefined,
      lines,
    });

    appendTx.mutate(tx, {
      onSuccess: () => {
        setDigits('');
        setPayee('');
        setNote('');
        setIsSplit(false);
        setTxType('expense');
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
      }
    });
  };

  const handleSaveCategory = (categoryId: string) => {
    saveLines([{ categoryId, amountMinor }]);
  };

  const handleToggleType = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTxType(prev => prev === 'expense' ? 'income' : 'expense');
  };

  const displayDateStr = date === new Date().toISOString().split('T')[0] ? 'Today' : date.slice(5);

  return (
    <SafeAreaView 
      className="flex-1 bg-surface" 
      edges={['top', 'left', 'right']}
    >
      <View className="flex-1 bg-surface">
        {/* Expense ↔ Income Toggle */}
        <View className="flex-row items-center justify-center pt-3 pb-1">
          <Pressable
            onPress={handleToggleType}
            className="flex-row items-center bg-surface-elevated rounded-full px-1 py-1 border border-border"
          >
            <View
              className={`px-4 py-1.5 rounded-full min-h-[36px] justify-center ${
                txType === 'expense' ? 'bg-danger' : ''
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  txType === 'expense' ? 'text-foreground' : 'text-foreground-muted'
                }`}
              >
                Expense
              </Text>
            </View>
            <View
              className={`px-4 py-1.5 rounded-full min-h-[36px] justify-center ${
                txType === 'income' ? 'bg-success' : ''
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  txType === 'income' ? 'text-foreground' : 'text-foreground-muted'
                }`}
              >
                Income
              </Text>
            </View>
          </Pressable>
        </View>

        <AmountDisplay amount={amountMinor} txType={txType} />

        {/* Date and Details Controls below Amount */}
        {!isSplit && (
          <View className="px-6 py-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Pressable 
                  onPress={() => setShowDatePicker(true)}
                  className="bg-surface-elevated px-3 py-1.5 rounded-lg min-h-[36px] justify-center"
                >
                  <Text className="text-foreground-secondary font-medium text-sm">
                    📅 {displayDateStr}
                  </Text>
                </Pressable>
                
                <Pressable 
                  onPress={() => setShowAccountPicker(true)}
                  className="bg-surface-elevated px-3 py-1.5 rounded-lg min-h-[36px] justify-center"
                >
                  <Text className="text-foreground-secondary font-medium text-sm">
                    🏦 {accounts.find(a => a.accountId === accountId)?.name || 'Select Account'}
                  </Text>
                </Pressable>
              </View>

              <Pressable 
                onPress={() => setShowDetails(!showDetails)} 
                className="py-2 min-h-[36px] justify-center" 
              >
                <Text className="text-foreground-muted font-medium text-sm">
                  {showDetails ? '- hide details' : '+ details'}
                </Text>
              </Pressable>
            </View>

            {showDetails && (
              <View className="mt-3 gap-y-2">
                <TextInput 
                  className="bg-surface-elevated text-foreground placeholder:text-foreground-placeholder p-3 rounded-xl min-h-[44px]"
                  placeholder="Payee" 
                  value={payee}
                  onChangeText={setPayee}
                />
                <TextInput 
                  className="bg-surface-elevated text-foreground placeholder:text-foreground-placeholder p-3 rounded-xl min-h-[44px]"
                  placeholder="Note" 
                  value={note}
                  onChangeText={setNote}
                />
              </View>
            )}
          </View>
        )}

        <View className="flex-1 justify-end">
          {isSplit ? (
            <SplitEditor 
              totalMinor={amountMinor} 
              onSave={saveLines} 
              onCancel={() => setIsSplit(false)} 
            />
          ) : (
            <CategoryGrid 
              txType={txType}
              onSelectCategory={handleSaveCategory} 
              onSplit={() => {
                if (amountMinor > 0) setIsSplit(true);
              }} 
            />
          )}
          <Keypad 
            onDigit={handleDigit} 
            onBackspace={handleBackspace} 
          />
        </View>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal transparent animationType="fade" visible={showDatePicker} onRequestClose={() => setShowDatePicker(false)}>
          <Pressable 
            className="flex-1 bg-surface-overlay justify-center items-center" 
            onPress={() => setShowDatePicker(false)}
          >
            <View className="w-[80%] bg-surface-elevated rounded-2xl p-4 gap-3 border border-border-strong">
              <Text className="text-foreground text-lg font-semibold text-center mb-1">Select Date</Text>
              {getQuickDates().map((d) => (
                <Pressable
                  key={d.value}
                  onPress={() => {
                    setDate(d.value);
                    setShowDatePicker(false);
                  }}
                  className="bg-surface-hover p-3.5 rounded-lg items-center"
                >
                  <Text className="text-foreground text-base font-medium">{d.label} ({d.value})</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
      )}

      {/* Account Picker Modal */}
      {showAccountPicker && (
        <Modal transparent animationType="fade" visible={showAccountPicker} onRequestClose={() => setShowAccountPicker(false)}>
          <Pressable 
            className="flex-1 bg-surface-overlay justify-center items-center" 
            onPress={() => setShowAccountPicker(false)}
          >
            <View className="w-[80%] bg-surface-elevated rounded-2xl p-4 gap-3 border border-border-strong">
              <Text className="text-foreground text-lg font-semibold text-center mb-1">Select Account</Text>
              {accounts.sort((a, b) => a.order - b.order).map((acc) => (
                <Pressable
                  key={acc.accountId}
                  onPress={() => {
                    setAccountId(acc.accountId);
                    setShowAccountPicker(false);
                  }}
                  className="bg-surface-hover p-3.5 rounded-lg items-center"
                >
                  <Text className="text-foreground text-base font-medium">{acc.name}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}
