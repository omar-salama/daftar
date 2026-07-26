import { useLocalSearchParams } from 'expo-router';
import { CategoryForm } from '@/features/categories/ui';

export default function CategoryFormScreen() {
  const { categoryId, type: defaultType } = useLocalSearchParams<{ categoryId?: string, type?: string }>();
  return <CategoryForm categoryId={categoryId} defaultType={defaultType} />;
}
