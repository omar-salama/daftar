import { useAppendCategory, useCategories } from '@/features/categories/hooks';
import { CategoryId, CategoryType } from '@/features/categories/model';
import { nextHLC, RowId } from '@/kernel';
import { generateUuid, getDeviceId, getHlcState, setHlcState } from '@/lib/storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CategoryFormScreen() {
  const { categoryId, type: defaultType } = useLocalSearchParams<{ categoryId?: string, type?: string }>();
  const router = useRouter();
  
  const { data: categories = [] } = useCategories();
  const appendCategory = useAppendCategory();
  
  const existingCategory = categories.find(c => c.categoryId === categoryId);
  const isEditing = !!existingCategory;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const type = (defaultType as CategoryType) || 'expense';
  
  useEffect(() => {
    if (existingCategory) {
      setName(existingCategory.name);
      setIcon(existingCategory.icon);
    }
  }, [existingCategory]);

  const handleSave = () => {
    if (!name.trim() || !icon.trim()) return;

    const now = Date.now();
    const deviceId = getDeviceId();
    const hlcState = getHlcState();
    const [version, nextState] = nextHLC(now, hlcState, deviceId);
    setHlcState(nextState);

    let maxOrder = 0;
    if (categories.length > 0) {
      const sameTypeCategories = categories.filter(c => c.type === type);
      if (sameTypeCategories.length > 0) {
        maxOrder = Math.max(...sameTypeCategories.map(c => c.order ?? 0));
      }
    }

    if (isEditing && existingCategory) {
      appendCategory.mutate({
        ...existingCategory,
        name: name.trim(),
        icon: icon.trim(),
        version,
      }, {
        onSuccess: () => router.back()
      });
    } else {
      appendCategory.mutate({
        rowId: generateUuid() as RowId,
        categoryId: generateUuid() as CategoryId,
        version,
        deviceId,
        isDeleted: false,
        name: name.trim(),
        type,
        icon: icon.trim(),
        order: maxOrder + 1,
      }, {
        onSuccess: () => router.back()
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="flex-row items-center justify-between px-6 py-4 bg-surface-elevated border-b border-border">
        <Pressable onPress={() => router.back()}>
          <Text className="text-foreground-secondary text-base">Cancel</Text>
        </Pressable>
        <Text className="text-lg font-bold text-foreground">
          {isEditing ? `Edit ${type.charAt(0).toUpperCase() + type.slice(1)} Category` : `New ${type.charAt(0).toUpperCase() + type.slice(1)} Category`}
        </Text>
        <Pressable onPress={handleSave} disabled={!name.trim() || !icon.trim()}>
          <Text className={`text-base font-semibold ${name.trim() && icon.trim() ? 'text-brand' : 'text-foreground-muted'}`}>
            Save
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
        <View className="mb-6 flex-row items-start gap-3">
          <View className="w-16">
            <Text className="text-sm font-medium text-foreground-secondary mb-2">Icon</Text>
            <TextInput
              className="bg-surface-elevated text-foreground rounded-xl border border-border text-center text-xl h-12"
              value={icon}
              onChangeText={setIcon}
              maxLength={2}
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-foreground-secondary mb-2">Category Name</Text>
            <TextInput
              className="bg-surface-elevated text-foreground px-3 rounded-xl border border-border h-12"
              placeholder="e.g. Groceries"
              placeholderTextColor="#71717a"
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
