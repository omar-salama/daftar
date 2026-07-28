import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ScaleDecorator } from 'react-native-draggable-flatlist';
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

  const [subCategories, setSubCategories] = useState<CategoryVersion[]>([]);

  useEffect(() => {
    setSubCategories(
      allRelevant
        .filter(c => c.parentId === item.categoryId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    );
  }, [allRelevant, item.categoryId]);



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
            {subCategories.map(subItem => (
              <View key={subItem.categoryId}>
                <CategoryListItem
                  item={subItem}
                  type={type}
                  isActive={false}
                  drag={() => {}}
                  onDelete={onDelete}
                />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScaleDecorator>
  );
};
