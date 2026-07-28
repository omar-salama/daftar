import { useState } from 'react';
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
  const subCategories = allRelevant
    .filter(c => c.parentId === item.categoryId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

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
          <View>
            {subCategories.map((subItem) => (
              <View
                key={subItem.categoryId}
                className="border-t border-surface-variant pl-4"
              >
                <CategoryListItem
                  item={subItem}
                  type={type}
                  isActive={false}
                  drag={() => { }} // Disabled for subcategories
                  onDelete={onDelete}
                  isSubCategory
                />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScaleDecorator>
  );
};
