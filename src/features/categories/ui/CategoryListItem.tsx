import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { ScaleDecorator } from 'react-native-draggable-flatlist';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useRouter } from 'expo-router';
import { CategoryVersion } from '../model';

interface CategoryListItemProps {
  item: CategoryVersion;
  type: string;
  isActive: boolean;
  drag: () => void;
  onDelete: (item: CategoryVersion) => void;
}

export function CategoryListItem({ item, type, isActive, drag, onDelete }: CategoryListItemProps) {
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
      className="bg-danger justify-center items-center px-5 mb-2 rounded-xl ml-2"
    >
      <Text className="text-foreground font-semibold text-base">Delete</Text>
    </Pressable>
  );

  return (
    <ScaleDecorator>
      <View className="px-4">
        <ReanimatedSwipeable
          renderRightActions={renderRightActions}
          overshootRight={false}
        >
          <View
            className={`flex-row justify-between items-center px-4 py-4 mb-2 rounded-xl border border-border ${
              isActive ? 'bg-surface-hover' : 'bg-surface-elevated'
            }`}
          >
            <View className="flex-row items-center flex-1">
              <Text className="text-2xl mr-3">{item.icon}</Text>
              <Text className="text-foreground text-lg">{item.name}</Text>
            </View>

            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => router.push(`/category-form?categoryId=${item.categoryId}&type=${type}`)}
                className="p-2"
                hitSlop={8}
              >
                <Text className="text-base">✏️</Text>
              </Pressable>

              <Pressable
                onPressIn={drag}
                disabled={isActive}
                className="p-2 -mr-2"
                hitSlop={8}
              >
                <Text className="text-lg text-foreground-muted font-bold">☰</Text>
              </Pressable>
            </View>
          </View>
        </ReanimatedSwipeable>
      </View>
    </ScaleDecorator>
  );
}
