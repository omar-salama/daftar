import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NestableDraggableFlatList, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useReorderCategories } from '../hooks';
import { CategoryVersion } from '../model';
import { CategoryListItem } from './CategoryListItem';

export const CategoryRow = ({ item, type, isActive, drag, onDelete, allRelevant }: {
  item: CategoryVersion;
  type: string;
  isActive: boolean;
  drag: () => void;
  onDelete: (item: CategoryVersion) => void;
  allRelevant: CategoryVersion[];
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const reorderCategories = useReorderCategories();

  const [subCategories, setSubCategories] = useState<CategoryVersion[]>([]);

  useEffect(() => {
    setSubCategories(
      allRelevant
        .filter(c => c.parentId === item.categoryId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    );
  }, [allRelevant, item.categoryId]);

  const handleSubDragEnd = ({ data: newData }: { data: CategoryVersion[] }) => {
    setSubCategories(newData);
    reorderCategories.mutate(newData);
  };

  return (
    <ScaleDecorator>
      <View className="border-b border-surface-container">
        <CategoryListItem
          item={item}
          type={type}
          isActive={isActive}
          drag={drag}
          onDelete={onDelete}
          hasSubCategories={subCategories.length > 0}
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
          subCount={subCategories.length}
        />
        {subCategories.length > 0 && isExpanded && (
          <View className="ml-7 border-l border-surface-variant">
            <NestableDraggableFlatList
              data={subCategories}
              onDragEnd={handleSubDragEnd}
              keyExtractor={(subItem) => subItem.categoryId}
              renderItem={({ item: subItem, drag: subDrag, isActive: subIsActive }) => (
                <ScaleDecorator>
                  <View>
                    <CategoryListItem
                      item={subItem}
                      type={type}
                      isActive={subIsActive}
                      drag={subDrag}
                      onDelete={onDelete}
                      isSubCategory
                    />
                  </View>
                </ScaleDecorator>
              )}
            />
          </View>
        )}
      </View>
    </ScaleDecorator>
  );
};
