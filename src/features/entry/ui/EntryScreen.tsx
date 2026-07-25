import { useAppendTx, useCreateTx } from '@/features/ledger/hooks/useLedger';
import type { TxId, TxLine } from '@/kernel';
import { minorFromDigits } from '@/kernel/money';
import { tokens } from '@/theme';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmountDisplay } from './AmountDisplay';
import { CategoryGrid } from './CategoryGrid';
import { Keypad } from './Keypad';
import { SplitEditor } from './SplitEditor';

export function EntryScreen() {
  const [digits, setDigits] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSplit, setIsSplit] = useState(false);
  
  const [showDetails, setShowDetails] = useState(false);
  const [payee, setPayee] = useState('');
  const [note, setNote] = useState('');

  const amountMinor = minorFromDigits(digits);
  
  const appendTx = useAppendTx();
  const createTx = useCreateTx();
  const router = useRouter();

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
      txId: uuidStr as TxId,
      occurredAt: date,
      accountId: 'default-account',
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

  const displayDateStr = date === new Date().toISOString().split('T')[0] ? 'Today' : date.slice(5);

  return (
    <SafeAreaView 
      className="flex-1 bg-surface" 
      edges={['top', 'left', 'right']}
    >
      <View className="flex-1 bg-surface">
        <AmountDisplay amount={amountMinor} />

        {/* Date and Details Controls below Amount */}
        {!isSplit && (
          <View className="px-6 py-2">
            <View className="flex-row items-center justify-between">
              <Pressable 
                onPress={() => setShowDatePicker(true)}
                className="bg-surface-elevated px-3 py-1.5 rounded-lg min-h-[36px] justify-center"
              >
                <Text className="text-foreground-secondary font-medium text-sm">
                  📅 {displayDateStr}
                </Text>
              </Pressable>

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
                  className="bg-surface-elevated text-foreground p-3 rounded-xl min-h-[44px]"
                  placeholder="Payee" 
                  placeholderTextColor={tokens.colors.foreground.placeholder}
                  value={payee}
                  onChangeText={setPayee}
                />
                <TextInput 
                  className="bg-surface-elevated text-foreground p-3 rounded-xl min-h-[44px]"
                  placeholder="Note" 
                  placeholderTextColor={tokens.colors.foreground.placeholder}
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
    </SafeAreaView>
  );
}
