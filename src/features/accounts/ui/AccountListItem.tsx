import { DEFAULT_CURRENCY, formatMinor, Minor, SUPPORTED_CURRENCIES } from '@/kernel/money';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { ScaleDecorator } from 'react-native-draggable-flatlist';
import { AccountVersion } from '../model';

interface AccountListItemProps {
  item: AccountVersion;
  balance: number;
  dueAmount?: number;
  drag: () => void;
  isActive: boolean;
  accountTypeName?: string;
  isLiability?: boolean;
}

export function AccountListItem({ item, balance, dueAmount = 0, drag, isActive, accountTypeName, isLiability }: AccountListItemProps) {
  const router = useRouter();
  const accountCurrency = SUPPORTED_CURRENCIES[item.currency] || DEFAULT_CURRENCY;

  return (
    <ScaleDecorator>
      <Pressable
        onLongPress={drag}
        disabled={isActive}
        onPress={() => router.push(`/accounts/${item.accountId}`)}
        className={`flex-row justify-between items-center px-4 py-4 mb-2 mx-4 rounded-xl border border-surface-variant ${
          isActive ? 'bg-surface-container-high' : 'bg-surface-container'
        }`}
      >
        <View>
          <Text className="text-lg font-semibold text-on-surface">{item.name}</Text>
          <Text className="text-sm text-on-surface-variant capitalize">{accountTypeName || item.type}</Text>
        </View>
        <View className="items-end flex-1">
          <Text className={`text-lg font-semibold ${isLiability && balance < 0 ? 'text-error' : 'text-on-surface'}`}>
            {formatMinor(isLiability ? Math.abs(balance as number) as Minor : balance as Minor, accountCurrency)}
          </Text>
          {isLiability && item.creditLimit !== undefined && (
            <View className="flex-row mt-1">
              <Text className="text-xs text-secondary mr-2">
                Available: {formatMinor((item.creditLimit + balance) as Minor, accountCurrency)}
              </Text>
              <Text className="text-xs text-error">
                Due: {formatMinor(Math.max(0, -(dueAmount as number)) as Minor, accountCurrency)}
              </Text>
            </View>
          )}
        </View>
        <View className="pl-3">
          <Text className="text-xs text-on-surface-variant">☰</Text>
        </View>
      </Pressable>
    </ScaleDecorator>
  );
}
