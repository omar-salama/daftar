import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCategories, useSaveCategory } from '../hooks';
import { CategoryId, CategoryType } from '../model';
import { ParentCategoryPickerModal } from './ParentCategoryPickerModal';
import { AppHeader } from '@/components/ui/AppHeader';

interface CategoryFormProps {
  categoryId?: string;
  defaultType?: string;
  defaultParentId?: string;
}

export function CategoryForm({ categoryId, defaultType, defaultParentId }: CategoryFormProps) {
  const router = useRouter();
  
  const { data: categories = [] } = useCategories();
  const saveCategory = useSaveCategory();
  
  const existingCategory = categories.find(c => c.categoryId === categoryId);
  const isEditing = !!existingCategory;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [parentId, setParentId] = useState<string | null>(defaultParentId || null);
  const [isParentPickerVisible, setIsParentPickerVisible] = useState(false);
  const type = (defaultType as CategoryType) || 'expense';
  
  useEffect(() => {
    if (existingCategory) {
      setName(existingCategory.name);
      setIcon(existingCategory.icon);
      setParentId(existingCategory.parentId ?? null);
    } else if (defaultParentId) {
      const parent = categories.find(c => c.categoryId === defaultParentId);
      if (parent) {
        setIcon(parent.icon);
      }
    }
  }, [existingCategory, defaultParentId]);

  const possibleParents = categories.filter(c => 
    !c.isDeleted && 
    c.type === type && 
    !c.parentId && 
    c.categoryId !== categoryId
  );
  
  const parentCategory = parentId ? categories.find(c => c.categoryId === parentId) : null;
  const subCategories = categories
    .filter(c => c.parentId === categoryId && !c.isDeleted)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName || !icon.trim()) return;

    const generatedSlug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const targetCategoryId = (generatedSlug || 'category') as CategoryId;

    const isDuplicate = categories.some(
      c => !c.isDeleted && 
           (c.categoryId === targetCategoryId || c.name.toLowerCase() === trimmedName.toLowerCase()) && 
           c.categoryId !== categoryId
    );

    if (isDuplicate) {
      Alert.alert(
        'Category Exists',
        `A category with the name "${trimmedName}" already exists. Please enter a unique name.`
      );
      return;
    }

    let maxOrder = 0;
    if (categories.length > 0) {
      const sameTypeCategories = categories.filter(c => c.type === type);
      if (sameTypeCategories.length > 0) {
        maxOrder = Math.max(...sameTypeCategories.map(c => c.order ?? 0));
      }
    }

    saveCategory.mutate({
      existingCategory,
      name: trimmedName,
      icon: icon.trim(),
      type,
      maxOrder,
      parentId: parentId ?? undefined
    }, {
      onSuccess: () => router.back()
    });
  };

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <AppHeader
        className="mb-6"
        title={isEditing ? `Edit ${type.charAt(0).toUpperCase() + type.slice(1)} Category` : `New ${type.charAt(0).toUpperCase() + type.slice(1)} Category`}
        leftAction={{ label: 'Cancel', onPress: () => router.back() }}
        rightAction={{ 
          label: 'Save', 
          onPress: handleSave, 
          disabled: !name.trim() || !icon.trim() || saveCategory.isPending 
        }}
      />

      <ScrollView className='flex-1' contentContainerClassName="px-4 gap-6" keyboardShouldPersistTaps="handled">
        <View className="flex-row items-start gap-3">
          <View className="w-16">
            <Text className="text-sm font-medium text-on-surface-variant mb-2">Icon</Text>
            <TextInput
              className="bg-surface-container text-on-surface rounded-xl border border-surface-variant text-center py-3"
              value={icon}
              onChangeText={setIcon}
              maxLength={2}
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-on-surface-variant mb-2">Category Name</Text>
            <TextInput
              className="bg-surface-container text-on-surface rounded-xl border border-surface-variant px-3 py-3"
              placeholder="e.g. Groceries"
              placeholderTextColor="#71717a"
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>
        </View>

        <View>
          <Text className="text-sm font-medium text-on-surface-variant mb-2">Parent Category</Text>
          <Pressable
            onPress={() => setIsParentPickerVisible(true)}
            className="bg-surface-container rounded-xl border border-surface-variant py-3 px-4 flex-row items-center"
          >
            {parentCategory ? (
              <>
                <Text className="text-xl mr-3">{parentCategory.icon}</Text>
                <Text className="text-on-surface text-base">{parentCategory.name}</Text>
              </>
            ) : (
              <Text className="text-on-surface text-base">None (Top Level)</Text>
            )}
          </Pressable>
        </View>

        {isEditing && !parentId && (
          <View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium text-on-surface-variant">Subcategories</Text>
              <Pressable
                onPress={() => router.push(`/category-form?type=${type}&parentId=${categoryId}`)}
                hitSlop={8}
              >
                <Text className="text-primary text-sm font-semibold">+ Add New</Text>
              </Pressable>
            </View>
            <View className="rounded-xl overflow-hidden border border-surface-variant bg-surface-container">
              {subCategories.length === 0 ? (
                <Text className="text-on-surface-variant text-sm py-3 px-4 text-center">No subcategories yet.</Text>
              ) : (
                subCategories.map((subItem, index) => (
                  <View key={subItem.categoryId} className={index !== subCategories.length - 1 ? "border-b border-surface-variant" : ""}>
                    <Pressable
                      onPress={() => router.push(`/category-form?categoryId=${subItem.categoryId}&type=${type}`)}
                      className="flex-row items-center justify-between py-3 px-4 bg-surface-container active:bg-surface-container-high"
                    >
                      <View className="flex-row items-center gap-3">
                        <Text>{subItem.icon}</Text>
                        <Text className="text-on-surface text-base">{subItem.name}</Text>
                      </View>
                      <Text className="text-on-surface-variant text-xl">›</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <ParentCategoryPickerModal
        visible={isParentPickerVisible}
        categories={possibleParents}
        onClose={() => setIsParentPickerVisible(false)}
        onSelect={(newParentId) => {
          setParentId(newParentId);
          if (newParentId) {
            const parent = possibleParents.find(p => p.categoryId === newParentId);
            if (parent) setIcon(parent.icon);
          }
        }}
      />
    </SafeAreaView>
  );
}
