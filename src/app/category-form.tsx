import { useLocalSearchParams } from 'expo-router';
import { CategoryForm } from '@/features/categories/ui';

export default function CategoryFormScreen() {
  const { categoryId, type: defaultType, parentId: defaultParentId } = useLocalSearchParams<{ categoryId?: string, type?: string, parentId?: string }>();
  return <CategoryForm categoryId={categoryId} defaultType={defaultType} defaultParentId={defaultParentId} />;
}
