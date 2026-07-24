import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Keypad } from './Keypad';
import { AmountDisplay } from './AmountDisplay';
import { CategoryGrid } from './CategoryGrid';
import { SplitEditor } from './SplitEditor';
import { minorFromDigits } from '@/kernel/money';
import { useAppendTx, useCreateTx } from '@/features/ledger/hooks/useLedger';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type { TxLine, TxId } from '@/kernel';

export function EntryScreen() {
  const [digits, setDigits] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isSplit, setIsSplit] = useState(false);
  
  const [showDetails, setShowDetails] = useState(false);
  const [payee, setPayee] = useState('');
  const [note, setNote] = useState('');

  const amountMinor = minorFromDigits(digits);
  
  const appendTx = useAppendTx();
  const createTx = useCreateTx();
  const router = useRouter();

  const handleDigit = (d: string) => {
    if (digits.length < 10) setDigits(prev => prev + d);
  };

  const handleBackspace = () => {
    setDigits(prev => prev.slice(0, -1));
  };

  const handleDateNudge = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(d.toISOString().split('T')[0]);
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

  return (
    <View className="flex-1 bg-zinc-950 pt-12">
      <AmountDisplay amount={amountMinor} />
      
      {!isSplit && (
        <View className="px-4 py-2">
           <Pressable onPress={() => setShowDetails(!showDetails)} className="py-2 min-h-[44px] justify-center">
             <Text className="text-zinc-400 font-medium">{showDetails ? '- hide details' : '+ details'}</Text>
           </Pressable>
           {showDetails && (
             <View className="space-y-4 mt-2 gap-y-2">
               <TextInput 
                 className="bg-zinc-900 text-zinc-100 p-3 rounded-xl min-h-[44px]"
                 placeholder="Payee" 
                 placeholderTextColor="#52525b"
                 value={payee}
                 onChangeText={setPayee}
               />
               <TextInput 
                 className="bg-zinc-900 text-zinc-100 p-3 rounded-xl min-h-[44px]"
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
          onDateNudge={handleDateNudge} 
          dateStr={date === new Date().toISOString().split('T')[0] ? 'Today' : date.slice(5)} 
        />
      </View>
    </View>
  );
}
