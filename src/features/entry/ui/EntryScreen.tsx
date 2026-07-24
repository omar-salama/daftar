import { useAppendTx, useCreateTx } from '@/features/ledger/hooks/useLedger';
import type { TxId, TxLine } from '@/kernel';
import { minorFromDigits } from '@/kernel/money';
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
      className="flex-1 bg-zinc-950" 
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: '#09090b' }}
    >
      <View className="flex-1 bg-zinc-950" style={{ flex: 1, backgroundColor: '#09090b' }}>
        <AmountDisplay amount={amountMinor} />

        {/* Date and Details Controls below Amount */}
        {!isSplit && (
          <View className="px-6 py-2" style={{ paddingHorizontal: 24, paddingVertical: 8 }}>
            <View 
              className="flex-row items-center justify-between"
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Pressable 
                onPress={() => setShowDatePicker(true)}
                className="bg-zinc-900 px-3 py-1.5 rounded-lg min-h-[36px] justify-center"
                style={{ backgroundColor: '#18181b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, minHeight: 36, justifyContent: 'center' }}
              >
                <Text className="text-zinc-300 font-medium text-sm" style={{ color: '#d4d4d8', fontWeight: '500', fontSize: 14 }}>
                  📅 {displayDateStr}
                </Text>
              </Pressable>

              <Pressable 
                onPress={() => setShowDetails(!showDetails)} 
                className="py-2 min-h-[36px] justify-center" 
                style={{ minHeight: 36, justifyContent: 'center' }}
              >
                <Text className="text-zinc-400 font-medium text-sm" style={{ color: '#a1a1aa', fontWeight: '500', fontSize: 14 }}>
                  {showDetails ? '- hide details' : '+ details'}
                </Text>
              </Pressable>
            </View>

            {showDetails && (
              <View className="space-y-4 mt-3 gap-y-2" style={{ marginTop: 12, gap: 8 }}>
                <TextInput 
                  className="bg-zinc-900 text-zinc-100 p-3 rounded-xl min-h-[44px]"
                  style={{ backgroundColor: '#18181b', color: '#f4f4f5', padding: 12, borderRadius: 12, minHeight: 44 }}
                  placeholder="Payee" 
                  placeholderTextColor="#52525b"
                  value={payee}
                  onChangeText={setPayee}
                />
                <TextInput 
                  className="bg-zinc-900 text-zinc-100 p-3 rounded-xl min-h-[44px]"
                  style={{ backgroundColor: '#18181b', color: '#f4f4f5', padding: 12, borderRadius: 12, minHeight: 44 }}
                  placeholder="Note" 
                  placeholderTextColor="#52525b"
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
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }} 
            onPress={() => setShowDatePicker(false)}
          >
            <View style={{ width: '80%', backgroundColor: '#18181b', borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: '#27272a' }}>
              <Text style={{ color: '#f4f4f5', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 4 }}>Select Date</Text>
              {getQuickDates().map((d) => (
                <Pressable
                  key={d.value}
                  onPress={() => {
                    setDate(d.value);
                    setShowDatePicker(false);
                  }}
                  style={{ backgroundColor: '#27272a', padding: 14, borderRadius: 10, alignItems: 'center' }}
                >
                  <Text style={{ color: '#f4f4f5', fontSize: 16, fontWeight: '500' }}>{d.label} ({d.value})</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}
