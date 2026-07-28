import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { CategoryId, CategoryType } from '../model';
import { useCategories, useSaveCategory } from './useCategories';

export interface UseCategoryFormProps {
  categoryId?: string;
  defaultType?: string;
  defaultParentId?: string;
}

export function useCategoryForm({ categoryId, defaultType, defaultParentId }: UseCategoryFormProps) {
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
  }, [existingCategory, defaultParentId, categories]);

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

  return {
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
    isPending: saveCategory.isPending,
    router,
  };
}
