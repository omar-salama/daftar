import { useRouter } from 'expo-router';
import { DraggableListItem } from '@/components/ui/DraggableListItem';
import { CategoryVersion } from '../model';

export interface CategoryListItemProps {
  item: CategoryVersion;
  type: string;
  isActive: boolean;
  drag: () => void;
  onDelete: (item: CategoryVersion) => void;
  hasSubCategories?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  subCount?: number;
  containerClassName?: string;
}

export function CategoryListItem({
  item,
  type,
  isActive,
  drag,
  onDelete,
  hasSubCategories,
  isExpanded,
  onToggleExpand,
  subCount,
  containerClassName = 'bg-surface'
}: CategoryListItemProps) {
  const router = useRouter();

  return (
    <DraggableListItem
      title={item.name}
      icon={item.icon}
      isActive={isActive}
      drag={drag}
      onDelete={() => onDelete(item)}
      onPress={() => router.push(`/category-form?categoryId=${item.categoryId}&type=${type}`)}
      entityName="Category"
      hasSubItems={hasSubCategories}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
      subItemCount={subCount}
      containerClassName={containerClassName}
    />
  );
}
