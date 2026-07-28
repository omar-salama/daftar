import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCategoryForm, UseCategoryFormProps } from '../hooks';
import { ParentCategoryPickerModal } from './ParentCategoryPickerModal';
import { SubcategoryList } from './SubcategoryList';
import { AppHeader } from '@/components/ui/AppHeader';

export function CategoryForm({ categoryId, defaultType, defaultParentId }: UseCategoryFormProps) {
  const {
    isEditing,
    name, setName,
    icon, setIcon,
    parentId, setParentId,
    isParentPickerVisible, setIsParentPickerVisible,
    type,
    possibleParents,
    parentCategory,
    subCategories,
    handleSave,
    isPending,
    router,
  } = useCategoryForm({ categoryId, defaultType, defaultParentId });

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <AppHeader
        className="mb-6"
        title={isEditing ? `Edit ${type.charAt(0).toUpperCase() + type.slice(1)} Category` : `New ${type.charAt(0).toUpperCase() + type.slice(1)} Category`}
        leftAction={{ label: 'Cancel', onPress: () => router.back() }}
        rightAction={{ 
          label: 'Save', 
          onPress: handleSave, 
          disabled: !name.trim() || !icon.trim() || isPending 
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

        {isEditing && !parentId && categoryId && (
          <SubcategoryList
            categoryId={categoryId}
            type={type}
            subCategories={subCategories}
          />
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
