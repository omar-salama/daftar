import { useReorderCategories } from '../hooks';
import { CategoryVersion } from '../model';
import { CategoryListItem } from './CategoryListItem';
import { DraggableList } from '@/components/ui/DraggableList';

export interface DraggableCategoryListProps {
  categories: CategoryVersion[];
  type: string;
  onDelete: (item: CategoryVersion) => void;

  withDividers?: boolean;
  containerClassName?: string;
  renderItemContent?: (params: import('react-native-draggable-flatlist').RenderItemParams<CategoryVersion>) => React.ReactNode;
}

export function DraggableCategoryList({
  categories,
  type,
  onDelete,

  withDividers = false,
  containerClassName,
  renderItemContent,
}: DraggableCategoryListProps) {
  const reorderCategories = useReorderCategories();

  return (
    <DraggableList
      items={categories}
      onReorder={(data) => reorderCategories.mutate(data)}
      keyExtractor={(item) => item.categoryId}
      withDividers={withDividers}
      renderItemContent={(params) => 
        renderItemContent ? renderItemContent(params) : (
          <CategoryListItem
            item={params.item}
            type={type}
            isActive={params.isActive}
            drag={params.drag}
            onDelete={onDelete}
            containerClassName={containerClassName}
          />
        )
      }
    />
  );
}
