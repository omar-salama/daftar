import { useRouter } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { AccountTypeVersion } from '../model';

interface AccountTypeListItemProps {
  item: AccountTypeVersion;
  isActive: boolean;
  drag: () => void;
  onDelete: (item: AccountTypeVersion) => void;
  containerClassName?: string;
}

export function AccountTypeListItem({
  item,
  isActive,
  drag,
  onDelete,
  containerClassName = 'bg-surface'
}: AccountTypeListItemProps) {
  const router = useRouter();

  const handleDelete = () => {
    Alert.alert('Delete Account Type', `Are you sure you want to delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(item)
      }
    ]);
  };

  const renderRightActions = () => (
    <Pressable
      onPress={handleDelete}
      className="bg-error justify-center items-center px-5"
    >
      <Text className="text-on-error font-semibold text-base">Delete</Text>
    </Pressable>
  );

  return (
    <ReanimatedSwipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
    >
      <View
        className={`flex-row justify-between items-center py-1 pl-4 pr-2 ${
          isActive ? 'bg-surface-container-high' : ''
        } ${containerClassName}`}
      >
        <Pressable
          className="flex-row items-center flex-1 py-3"
          onPress={() => router.push(`/account-type-form?accountTypeId=${item.accountTypeId}`)}
        >
          {item.icon && <Text className="mr-3">{item.icon}</Text>}
          <View className="flex-row items-center flex-shrink">
            <Text className="text-on-surface" numberOfLines={1}>{item.name}</Text>
          </View>
        </Pressable>

        <View className="flex-row items-center gap-1">
          <Pressable
            onPressIn={drag}
            disabled={isActive}
            className="p-2"
            hitSlop={8}
          >
            <Text className="text-lg text-on-surface-variant font-bold">☰</Text>
          </Pressable>
        </View>
      </View>
    </ReanimatedSwipeable>
  );
}
