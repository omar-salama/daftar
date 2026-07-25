import { useAppendCategory, useCategories } from '@/features/categories/hooks';
import { CategoryVersion } from '@/features/categories/model';
import { nextHLC } from '@/kernel';
import { getDeviceId, getHlcState, setHlcState } from '@/lib/storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CategoryManagementScreen() {
  const { type = 'expense' } = useLocalSearchParams<{ type?: string }>();
  const router = useRouter();
  
  const { data: categories = [] } = useCategories();
  const appendCategory = useAppendCategory();
  
  const [data, setData] = useState<CategoryVersion[]>([]);

  useEffect(() => {
    setData(
      categories
        .filter(c => c.type === type)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    );
  }, [categories, type]);

  const handleDragEnd = ({ data: newData }: { data: CategoryVersion[] }) => {
    setData(newData);
    const now = Date.now();
    const deviceId = getDeviceId();
    let hlcState = getHlcState();

    newData.forEach((category, index) => {
      if (category.order !== index) {
        const [version, nextState] = nextHLC(now, hlcState, deviceId);
        hlcState = nextState;
        
        appendCategory.mutate({
          ...category,
          version,
          order: index,
        });
      }
    });
    setHlcState(hlcState);
  };

  const handleDelete = (category: CategoryVersion) => {
    Alert.alert('Delete Category', `Are you sure you want to delete "${category.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: () => {
          const now = Date.now();
          const deviceId = getDeviceId();
          const hlcState = getHlcState();
          const [version, nextState] = nextHLC(now, hlcState, deviceId);
          setHlcState(nextState);

          appendCategory.mutate({
            ...category,
            isDeleted: true,
            version,
          });
        }
      }
    ]);
  };

  const renderRightActions = (item: CategoryVersion) => (
    <Pressable
      onPress={() => handleDelete(item)}
      className="bg-danger justify-center items-center px-5 mb-2 rounded-xl ml-2"
    >
      <Text className="text-foreground font-semibold text-base">Delete</Text>
    </Pressable>
  );

  const renderItem = ({ item, drag, isActive }: RenderItemParams<CategoryVersion>) => {
    return (
      <ScaleDecorator>
        <View className="px-4">
          <ReanimatedSwipeable
            renderRightActions={() => renderRightActions(item)}
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
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        
        <View className="flex-row items-center justify-between px-3 py-2">
          <Pressable onPress={() => router.back()}>
            <Text className="text-foreground-secondary text-xl font-medium">‹ Back</Text>
          </Pressable>

          <Pressable onPress={() => router.push(`/category-form?type=${type}`)}>
            <Text className="text-foreground-secondary font-semibold text-3xl leading-6">+</Text>
          </Pressable>
        </View>
        
        <Text className="text-3xl font-bold text-foreground px-4 mt-2 mb-4">
          {type === 'expense' ? 'Expense Categories' : 'Income Categories'}
        </Text>
        
        <View className="flex-1">
          {data.length === 0 ? (
            <Text className="text-foreground-secondary text-center mt-8 mb-4">No categories found.</Text>
          ) : (
            <DraggableFlatList
              data={data}
              onDragEnd={handleDragEnd}
              keyExtractor={(item) => item.categoryId}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          )}
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
