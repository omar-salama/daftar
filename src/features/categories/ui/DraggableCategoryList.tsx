import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NestableDraggableFlatList, RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useReorderCategories } from '../hooks';
import { CategoryVersion } from '../model';
import { CategoryListItem } from './CategoryListItem';

export interface DraggableCategoryListProps {
  categories: CategoryVersion[];
  type: string;
  onDelete: (item: CategoryVersion) => void;
  isSubCategory?: boolean;
  withDividers?: boolean;
  containerClassName?: string;
  renderItem?: (params: RenderItemParams<CategoryVersion>) => React.ReactNode;
}

export function DraggableCategoryList({
  categories: initialCategories,
  type,
  onDelete,
  isSubCategory = false,
  withDividers = false,
  containerClassName,
  renderItem,
}: DraggableCategoryListProps) {
  const [categories, setCategories] = useState(initialCategories);
  const reorderCategories = useReorderCategories();

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const handleDragEnd = ({ data }: { data: CategoryVersion[] }) => {
    setCategories(data);
    reorderCategories.mutate(data);
  };

  const defaultRenderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<CategoryVersion>) => {
    const index = getIndex() ?? 0;
    const showDivider = withDividers && index < categories.length - 1;
    
    return (
      <ScaleDecorator>
        <View className={showDivider ? 'border-b border-surface-variant' : ''}>
          <CategoryListItem
            item={item}
            type={type}
            isActive={isActive}
            drag={drag}
            onDelete={onDelete}
            containerClassName={containerClassName}
          />
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <NestableDraggableFlatList
      data={categories}
      onDragEnd={handleDragEnd}
      keyExtractor={(item) => item.categoryId}
      renderItem={renderItem ?? defaultRenderItem}
    />
  );
}
