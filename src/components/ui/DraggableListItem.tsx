import { Alert, Pressable, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

export interface DraggableListItemProps {
  title: string;
  icon?: string;
  isActive: boolean;
  drag: () => void;
  onPress: () => void;
  onDelete: () => void;
  entityName?: string; // used for delete alert, e.g. "Category"
  
  // Optional sub-item props (used by categories)
  hasSubItems?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  subItemCount?: number;
  
  containerClassName?: string;
}

export function DraggableListItem({
  title,
  icon,
  isActive,
  drag,
  onPress,
  onDelete,
  entityName = 'Item',
  hasSubItems,
  isExpanded,
  onToggleExpand,
  subItemCount,
  containerClassName = 'bg-surface'
}: DraggableListItemProps) {
  const handleDelete = () => {
    Alert.alert(`Delete ${entityName}`, `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: onDelete
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
        className={`flex-row justify-between items-center py-1 pl-4 pr-2 ${isActive ? 'bg-surface-container-high' : ''
          } ${containerClassName}
        `}
      >
        <Pressable
          className="flex-row items-center flex-1 py-3"
          onPress={onPress}
        >
          {!!icon && <Text className="mr-3">{icon}</Text>}
          <View className="flex-row items-center flex-shrink">
            <Text className="text-on-surface" numberOfLines={1}>{title}</Text>
            {!!subItemCount && subItemCount > 0 && (
              <Text className="text-on-surface-variant text-sm ml-1">
                ({subItemCount})
              </Text>
            )}
          </View>
        </Pressable>

        <View className="flex-row items-center gap-1">
          {hasSubItems && (
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
