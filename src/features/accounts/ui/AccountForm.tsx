import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Minor, minorFromDigits } from '@/kernel/money';
import { useAccountBalances } from '../hooks/useAccountBalances';
import { useAccounts, useSaveAccount } from '../hooks/useAccounts';
import { AccountType } from '../model';

import { useAccountTypes } from '@/features/account-types/hooks';

interface AccountFormProps {
  accountId?: string;
}

export function AccountForm({ accountId }: AccountFormProps) {
  const router = useRouter();
  
  const { data: accounts = [] } = useAccounts();
  const { data: accountTypes = [] } = useAccountTypes();
  const saveAccount = useSaveAccount();
  const { balances } = useAccountBalances();
  
  const existingAccount = accounts.find(a => a.accountId === accountId);
  const isEditing = !!existingAccount;

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('');
  const [note, setNote] = useState('');
  const [balanceInput, setBalanceInput] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [billingCycleStartDay, setBillingCycleStartDay] = useState('');
  const [paymentDay, setPaymentDay] = useState('');
  
  useEffect(() => {
    if (existingAccount) {
      setName(existingAccount.name);
      setType(existingAccount.type);
      setNote(existingAccount.note || '');
      setCreditLimit(existingAccount.creditLimit ? (existingAccount.creditLimit / 100).toString() : '');
      setBillingCycleStartDay(existingAccount.billingCycleStartDay ? String(existingAccount.billingCycleStartDay) : '');
      setPaymentDay(existingAccount.paymentDay ? String(existingAccount.paymentDay) : '');
      
      const currentBalance = balances[existingAccount.accountId] || 0;
      const isWhole = currentBalance % 100 === 0;
      setBalanceInput(isWhole ? (currentBalance / 100).toString() : (currentBalance / 100).toFixed(2));
    } else if (!type && accountTypes.length > 0) {
      setType(accountTypes[0].accountTypeId);
    }
  }, [existingAccount, balances, accountTypes, type]);

  const selectedTypeInfo = accountTypes.find(t => t.accountTypeId === type);
  const isLiability = selectedTypeInfo?.isLiability;

  const handleSave = () => {
    if (!name.trim()) return;

    const targetBalanceMinor = minorFromDigits(balanceInput);
    let initialBalance = targetBalanceMinor;

    if (existingAccount) {
      const currentBalance = balances[existingAccount.accountId] || 0;
      const ledgerSum = currentBalance - (existingAccount.initialBalance || 0);
      initialBalance = (targetBalanceMinor - ledgerSum) as Minor;
    }

    let maxOrder = 0;
    if (accounts.length > 0) {
      maxOrder = Math.max(...accounts.map(a => a.order));
    }

    saveAccount.mutate({
      existingAccount,
      name: name.trim(),
      type,
      note: note.trim() || undefined,
      initialBalance,
      maxOrder,
      creditLimit: isLiability && creditLimit ? minorFromDigits(creditLimit) : undefined,
      billingCycleStartDay: isLiability && billingCycleStartDay ? parseInt(billingCycleStartDay, 10) : undefined,
      paymentDay: isLiability && paymentDay ? parseInt(paymentDay, 10) : undefined,
    }, {
      onSuccess: () => router.back()
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3 bg-surface-container border-b border-surface-variant">
        <Pressable onPress={() => router.back()}>
          <Text className="text-on-surface-variant text-base">Cancel</Text>
        </Pressable>
        <Text className="text-lg font-bold text-on-surface">
          {isEditing ? 'Edit Account' : 'New Account'}
        </Text>
        <Pressable onPress={handleSave} disabled={!name.trim() || saveAccount.isPending}>
          <Text className={`text-base font-semibold ${name.trim() ? 'text-primary' : 'text-on-surface-variant'}`}>
            Save
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
        <View className="mb-6">
          <Text className="text-sm font-medium text-on-surface-variant mb-2">Account Name</Text>
          <TextInput
            className="bg-surface-container text-on-surface p-3 rounded-xl border border-surface-variant text-base"
            placeholder="e.g. Chase Sapphire"
            placeholderTextColor="#71717a"
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-on-surface-variant mb-2">Balance</Text>
          <TextInput
            className="bg-surface-container text-on-surface p-3 rounded-xl border border-surface-variant text-base"
            placeholder="0.00"
            placeholderTextColor="#71717a"
            value={balanceInput}
            onChangeText={setBalanceInput}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-on-surface-variant mb-2">Account Type</Text>
          <View className="flex-row flex-wrap gap-2">
            {accountTypes.map((t) => (
              <Pressable
                key={t.accountTypeId}
                onPress={() => setType(t.accountTypeId)}
                className={`px-4 py-2 rounded-lg border ${
                  type === t.accountTypeId 
                    ? 'bg-primary border-primary' 
                    : 'bg-surface-container border-surface-variant'
                }`}
              >
                <Text className={`font-medium ${
                  type === t.accountTypeId ? 'text-surface' : 'text-on-surface'
                }`}>
                  {t.icon ? `${t.icon} ` : ''}{t.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {isLiability && (
          <>
            <View className="mb-6">
              <Text className="text-sm font-medium text-on-surface-variant mb-2">Credit Limit (Optional)</Text>
              <TextInput
                className="bg-surface-container text-on-surface p-3 rounded-xl border border-surface-variant text-base"
                placeholder="5000.00"
                placeholderTextColor="#71717a"
                value={creditLimit}
                onChangeText={setCreditLimit}
                keyboardType="decimal-pad"
              />
            </View>
            <View className="mb-6 flex-row gap-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-on-surface-variant mb-2">Billing Cycle Start Day</Text>
                <TextInput
                  className="bg-surface-container text-on-surface p-3 rounded-xl border border-surface-variant text-base"
                  placeholder="15"
                  placeholderTextColor="#71717a"
                  value={billingCycleStartDay}
                  onChangeText={setBillingCycleStartDay}
                  keyboardType="number-pad"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-on-surface-variant mb-2">Payment Day</Text>
                <TextInput
                  className="bg-surface-container text-on-surface p-3 rounded-xl border border-surface-variant text-base"
                  placeholder="25"
                  placeholderTextColor="#71717a"
                  value={paymentDay}
                  onChangeText={setPaymentDay}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </>
        )}

        <View className="mb-6">
          <Text className="text-sm font-medium text-on-surface-variant mb-2">Note (Optional)</Text>
          <TextInput
            className="bg-surface-container text-on-surface p-3 rounded-xl border border-surface-variant text-base min-h-[80px]"
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
