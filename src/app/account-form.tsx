import { useAccounts, useAppendAccount } from '@/features/accounts/hooks/useAccounts';
import { AccountId, AccountType } from '@/features/accounts/model';
import { nextHLC, RowId } from '@/kernel';
import { generateUuid, getDeviceId, getHlcState, setHlcState } from '@/lib/storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAccountBalances } from '@/features/accounts/hooks/useAccountBalances';
import { minorFromDigits, Minor } from '@/kernel/money';

const ACCOUNT_TYPES: { label: string; value: AccountType }[] = [
  { label: 'Cash', value: 'cash' },
  { label: 'Bank', value: 'bank' },
  { label: 'Credit', value: 'credit' },
  { label: 'Savings', value: 'savings' },
  { label: 'Prepaid', value: 'prepaid' },
  { label: 'Investment', value: 'investment' },
  { label: 'Others', value: 'others' },
];

export default function AccountFormScreen() {
  const { accountId } = useLocalSearchParams<{ accountId?: string }>();
  const router = useRouter();
  
  const { data: accounts = [] } = useAccounts();
  const appendAccount = useAppendAccount();
  const { balances } = useAccountBalances();
  
  const existingAccount = accounts.find(a => a.accountId === accountId);
  const isEditing = !!existingAccount;

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('cash');
  const [note, setNote] = useState('');
  const [balanceInput, setBalanceInput] = useState('');
  
  useEffect(() => {
    if (existingAccount) {
      setName(existingAccount.name);
      setType(existingAccount.type);
      setNote(existingAccount.note || '');
      
      const currentBalance = balances[existingAccount.accountId] || 0;
      const isWhole = currentBalance % 100 === 0;
      setBalanceInput(isWhole ? (currentBalance / 100).toString() : (currentBalance / 100).toFixed(2));
    }
  }, [existingAccount]);

  const handleSave = () => {
    if (!name.trim()) return;

    const targetBalanceMinor = minorFromDigits(balanceInput);
    let newInitialBalance = targetBalanceMinor;

    if (existingAccount) {
      const currentBalance = balances[existingAccount.accountId] || 0;
      const ledgerSum = currentBalance - (existingAccount.initialBalance || 0);
      newInitialBalance = (targetBalanceMinor - ledgerSum) as Minor;
    }

    const now = Date.now();
    const deviceId = getDeviceId();
    const hlcState = getHlcState();
    const [version, nextState] = nextHLC(now, hlcState, deviceId);
    setHlcState(nextState);

    let maxOrder = 0;
    if (accounts.length > 0) {
      maxOrder = Math.max(...accounts.map(a => a.order));
    }

    if (isEditing && existingAccount) {
      appendAccount.mutate({
        ...existingAccount,
        name: name.trim(),
        type,
        note: note.trim() || undefined,
        initialBalance: newInitialBalance,
        version,
      }, {
        onSuccess: () => router.back()
      });
    } else {
      appendAccount.mutate({
        rowId: generateUuid() as RowId,
        accountId: generateUuid() as AccountId,
        version,
        deviceId,
        isDeleted: false,
        name: name.trim(),
        type,
        order: maxOrder + 1,
        currency: 'USD',
        note: note.trim() || undefined,
        initialBalance: newInitialBalance,
        createdAt: new Date(now).toISOString(),
      }, {
        onSuccess: () => router.back()
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3 bg-surface-elevated border-b border-border">
        <Pressable onPress={() => router.back()}>
          <Text className="text-foreground-secondary text-base">Cancel</Text>
        </Pressable>
        <Text className="text-lg font-bold text-foreground">
          {isEditing ? 'Edit Account' : 'New Account'}
        </Text>
        <Pressable onPress={handleSave} disabled={!name.trim()}>
          <Text className={`text-base font-semibold ${name.trim() ? 'text-brand' : 'text-foreground-muted'}`}>
            Save
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
        <View className="mb-6">
          <Text className="text-sm font-medium text-foreground-secondary mb-2">Account Name</Text>
          <TextInput
            className="bg-surface-elevated text-foreground p-3 rounded-xl border border-border text-base"
            placeholder="e.g. Chase Sapphire"
            placeholderTextColor="#71717a"
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-foreground-secondary mb-2">Balance</Text>
          <TextInput
            className="bg-surface-elevated text-foreground p-3 rounded-xl border border-border text-base"
            placeholder="0.00"
            placeholderTextColor="#71717a"
            value={balanceInput}
            onChangeText={setBalanceInput}
            keyboardType="decimal-pad"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-foreground-secondary mb-2">Account Type</Text>
          <View className="flex-row flex-wrap gap-2">
            {ACCOUNT_TYPES.map((t) => (
              <Pressable
                key={t.value}
                onPress={() => setType(t.value)}
                className={`px-4 py-2 rounded-lg border ${
                  type === t.value 
                    ? 'bg-brand border-brand' 
                    : 'bg-surface-elevated border-border'
                }`}
              >
                <Text className={`font-medium ${
                  type === t.value ? 'text-surface' : 'text-foreground'
                }`}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-foreground-secondary mb-2">Note (Optional)</Text>
          <TextInput
            className="bg-surface-elevated text-foreground p-3 rounded-xl border border-border text-base min-h-[80px]"
            placeholder="Account details, last 4 digits..."
            placeholderTextColor="#71717a"
            value={note}
            onChangeText={setNote}
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
