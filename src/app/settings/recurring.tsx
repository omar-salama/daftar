import { AppHeader } from '@/components/ui/AppHeader';
import { useCategories } from '@/features/categories/hooks';
import {
  useRecurrenceRules,
  useAppendRecurrenceRule,
  createRecurrenceRule,
} from '@/features/recurrence/hooks';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useMainCurrency } from '@/features/settings/hooks/useSettings';
import {
  RecurrenceRule,
  formatMinor,
  SUPPORTED_CURRENCIES,
  DEFAULT_CURRENCY,
} from '@/kernel';
import { Stack } from 'expo-router';
import { Alert, FlatList, Pressable, Switch, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function formatDate(dateStr: string) {
  // Assuming 'YYYY-MM-DD'
  const [, m, d] = dateStr.split('-');
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
}

function RecurrenceListItem({
  rule,
  onToggle,
  onDelete,
}: {
  rule: RecurrenceRule;
  onToggle: (isActive: boolean) => void;
  onDelete: () => void;
}) {
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: mainCurrency = 'EGP' } = useMainCurrency();
  const currencyConfig = SUPPORTED_CURRENCIES[mainCurrency] || DEFAULT_CURRENCY;

  const primaryLine = rule.lines[0];
  const category = categories.find(
    (c) => c.categoryId === primaryLine?.categoryId,
  );
  const account = accounts.find((a) => a.accountId === rule.accountId);

  let dateTitle = '';

  if (rule.lastMaterializedDate) {
    dateTitle = `Last: ${formatDate(rule.lastMaterializedDate)}`;
  } else {
    dateTitle = `Starts: ${formatDate(rule.startDate)}`;
  }

  const icon = rule.type === 'transfer' ? '⇄' : category?.icon || '🪙';

  const handleDelete = () => {
    Alert.alert(
      'Delete Rule',
      'Are you sure you want to delete this rule? This will not delete previously generated transactions.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ],
    );
  };

  const renderRightActions = () => (
    <Pressable
      onPress={handleDelete}
      className="bg-error justify-center items-center px-5 border-b border-surface-container-highest"
    >
      <Text className="text-on-error font-semibold text-base">Delete</Text>
    </Pressable>
  );

  return (
    <ReanimatedSwipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
    >
      <View className="flex-row items-center px-4 py-2 border-b border-surface-container-highest bg-surface">
        <View className="flex-1 flex-row gap-x-2 items-start">
          <Text>{icon}</Text>
          <View>
            <Text className="text-on-surface font-semibold">
              {rule.payee ?? category?.name ?? 'Unknown'}
            </Text>
            <Text className="text-on-surface-variant">{dateTitle}</Text>
          </View>
        </View>
        <View className="w-32">
          <Text
            className={`text-base font-medium ${rule.type === 'income' ? 'text-green-500' : 'text-on-surface'}`}
          >
            {rule.type === 'income' ? '+' : ''}
            {formatMinor(rule.totalMinor, currencyConfig)}
          </Text>
          <Text className="text-on-surface-variant capitalize">
            {account?.name} • {rule.frequency}
          </Text>
        </View>
        <View>
          <Switch value={rule.isActive} onValueChange={onToggle} />
        </View>
      </View>
    </ReanimatedSwipeable>
  );
}

export default function RecurringSettingsScreen() {
  const { data: rules = [] } = useRecurrenceRules({ mode: 'recurring' });
  const appendRule = useAppendRecurrenceRule();

  const handleToggle = (rule: RecurrenceRule, isActive: boolean) => {
    const updatedRule = createRecurrenceRule({
      ...rule,
      isActive,
    });
    appendRule.mutate(updatedRule);
  };

  const handleDeleteRule = (rule: RecurrenceRule) => {
    const updatedRule = createRecurrenceRule({
      ...rule,
      isDeleted: true,
    });
    appendRule.mutate(updatedRule);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader title="Recurring Entries" />

      {rules.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-y-2">
          <MaterialCommunityIcons
            name="calendar-blank"
            size={64}
            color="#9ca3af"
          />
          <Text className="text-on-surface-variant text-center text-lg">
            No active recurring entries.
          </Text>
        </View>
      ) : (
        <FlatList
          data={rules}
          keyExtractor={(item) => item.recurrenceId}
          renderItem={({ item }) => (
            <RecurrenceListItem
              rule={item}
              onToggle={(isActive) => handleToggle(item, isActive)}
              onDelete={() => handleDeleteRule(item)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
