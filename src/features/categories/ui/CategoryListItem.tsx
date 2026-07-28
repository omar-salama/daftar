import { useRouter } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';
import { ScaleDecorator } from 'react-native-draggable-flatlist';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { CategoryVersion } from '../model';

interface CategoryListItemProps {
  item: CategoryVersion;
  type: string;
  isActive: boolean;
  drag: () => void;
  onDelete: (item: CategoryVersion) => void;
  isSubCategory?: boolean;
  hasSubCategories?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  subCount?: number;
}

export function CategoryListItem({ 
  item, 
  type, 
  isActive, 
  drag, 
  onDelete, 
  isSubCategory,
  hasSubCategories,
  isExpanded,
  onToggleExpand,
  subCount
}: CategoryListItemProps) {
  const router = useRouter();

  const handleDelete = () => {
    Alert.alert('Delete Category', `Are you sure you want to delete "${item.name}"?`, [
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
      className="bg-error justify-center items-center px-5 mb-2 rounded-xl ml-2"
    >
      <Text className="text-on-surface font-semibold text-base">Delete</Text>
    </Pressable>
  );

  const content = (
    <View className="px-4">
      <ReanimatedSwipeable
        renderRightActions={renderRightActions}
        overshootRight={false}
      >
        <View
          className={`flex-row justify-between items-center pl-4 pr-2 mb-2 rounded-xl border border-surface-variant ${
            isActive ? 'bg-surface-container-high' : 'bg-surface-container'
          }`}
        >
          <Pressable 
            className="flex-row items-center flex-1 py-3"
            onPress={() => router.push(`/category-form?categoryId=${item.categoryId}&type=${type}`)}
          >
            <Text className="mr-3">{item.icon}</Text>
            <View className="flex-row items-center flex-shrink">
              <Text className="text-on-surface" numberOfLines={1}>{item.name}</Text>
              {!!subCount && subCount > 0 && (
                <Text className="text-on-surface-variant text-sm ml-1">
                  ({subCount})
                </Text>
              )}
            </View>
          </Pressable>

          <View className="flex-row items-center gap-1">
            {hasSubCategories && (
              <Pressable
                onPress={onToggleExpand}
                className="p-2"
                hitSlop={8}
              >
                <Text className="text-on-surface-variant text-sm">
                  {isExpanded ? '▼' : '▶'}
                </Text>
              </Pressable>
            )}
            {!isSubCategory && (
              <Pressable
                onPressIn={drag}
                disabled={isActive}
                className="p-2"
                hitSlop={8}
              >
                <Text className="text-lg text-on-surface-variant font-bold">☰</Text>
              </Pressable>
            )}
          </View>
        </View>
      </ReanimatedSwipeable>
    </View>
  );

  if (isSubCategory) {
    return content;
  }

  return (
    <ScaleDecorator>
      {content}
    </ScaleDecorator>
  );
}
