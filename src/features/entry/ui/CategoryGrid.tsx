import type { TxType } from '@/kernel';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useCategories } from '../../categories/hooks';

interface CategoryGridProps {
  txType: TxType;
  onSelectCategory: (id: string) => void;
  onSplit: (categories?: string[]) => void;
  selectedCategoryId?: string;
  isAddMode?: boolean; // When used inside SplitEditor to just add one category
  disabledCategoryIds?: string[];
}

export function CategoryGrid({ txType, onSelectCategory, onSplit, selectedCategoryId, isAddMode, disabledCategoryIds = [] }: CategoryGridProps) {
  const { data: categories, isLoading } = useCategories();
  const [expandedParentId, setExpandedParentId] = useState<string | null>(null);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [multiSelectedIds, setMultiSelectedIds] = useState<string[]>([]);

  const relevantCategories = useMemo(() => {
    return categories ? categories.filter(c => c.type === txType) : [];
  }, [categories, txType]);

  const gridItems = useMemo(() => {
    const parents = relevantCategories.filter(c => !c.parentId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    
    if (expandedParentId) {
      const parent = parents.find(p => p.categoryId === expandedParentId);
      if (parent) {
        const children = relevantCategories
          .filter(c => c.parentId === parent.categoryId)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map(c => ({ ...c, isSubCategory: true }));
        return [parent, ...children];
      }
    }

    // Only show parents and orphaned categories
    const orphaned = relevantCategories
      .filter(c => c.parentId && !parents.some(p => p.categoryId === c.parentId))
      .map(c => ({ ...c, isSubCategory: true }));
      
    return [...parents, ...orphaned].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [relevantCategories, expandedParentId]);

  if (isLoading || !categories) {
    return (
      <View className="p-4 items-center justify-center border-t border-surface-variant bg-surface">
        <ActivityIndicator size="small" />
      </View>
    );
  }

  const handlePressCategory = (categoryId: string) => {
    const hasSubCategories = relevantCategories.some(sub => sub.parentId === categoryId);

    if (!expandedParentId && hasSubCategories) {
      setExpandedParentId(categoryId);
    } else {
      if (isMultiSelectMode) {
        setMultiSelectedIds(prev => 
          prev.includes(categoryId) 
            ? prev.filter(id => id !== categoryId)
            : [...prev, categoryId]
        );
      } else {
        onSelectCategory(categoryId);
      }
    }
  };

  const handlePressSplit = () => {
    if (!isMultiSelectMode) {
      setIsMultiSelectMode(true);
      setMultiSelectedIds([]);
    } else {
      if (multiSelectedIds.length === 0) {
        setIsMultiSelectMode(false);
      } else {
        onSplit(multiSelectedIds);
        setIsMultiSelectMode(false);
        setMultiSelectedIds([]);
      }
    }
  };

  return (
    <View className="flex-row flex-wrap bg-surface">
      {expandedParentId && (
        <View className="w-1/4 px-1 pt-1">
          <Pressable
            onPress={() => setExpandedParentId(null)}
            className="items-center justify-center rounded gap-1 p-2 min-h-[52px] flex-col bg-surface-container active:bg-surface-container-high border border-transparent"
          >
            <Text className="text-lg">🔙</Text>
            <Text className="text-[10px] font-medium text-on-surface-variant" numberOfLines={1}>
              Back
            </Text>
          </Pressable>
        </View>
      )}

      {gridItems.map(c => {
        const isSelected = isMultiSelectMode 
          ? multiSelectedIds.includes(c.categoryId)
          : c.categoryId === selectedCategoryId;
        const hasSubCategories = relevantCategories.some(sub => sub.parentId === c.categoryId);
        const isDisabled = disabledCategoryIds.includes(c.categoryId);
        
        return (
          <View key={c.categoryId} className="w-1/4 px-0.5 pt-1">
            <Pressable
              onPress={() => {
                if (isDisabled && !hasSubCategories) return;
                handlePressCategory(c.categoryId);
              }}
              testID={`category-${c.categoryId}`}
              className={`items-center justify-center rounded gap-1 p-2 min-h-[52px] flex-col border relative ${
                isSelected 
                  ? 'border-primary bg-primary-container' 
                  : (isDisabled && !hasSubCategories ? 'border-outline bg-surface opacity-40' : 'border-transparent bg-surface-container active:bg-surface-container-high')
              }`}
            >
              <Text className="text-lg">{c.icon}</Text>
              <Text
                className='text-xs font-medium text-on-surface-variant'
                numberOfLines={1}
              >
                {c.name}
              </Text>
              {!expandedParentId && hasSubCategories && (
                <Text className="absolute bottom-0 right-1 text-sm font-bold text-on-surface">↴</Text>
              )}
            </Pressable>
          </View>
        );
      })}
      
      {!expandedParentId && txType === 'expense' && !isAddMode && (
        <View className="w-1/4 px-0.5 pt-1">
          <Pressable
            onPress={handlePressSplit}
            className={`items-center justify-center rounded gap-1 p-2 min-h-[52px] flex-col border active:opacity-70 ${isMultiSelectMode ? (multiSelectedIds.length > 0 ? 'bg-primary-container border-primary' : 'bg-error-container border-error') : 'bg-surface-container border-transparent'}`}
          >
            <Text className="text-lg">
              {isMultiSelectMode ? (multiSelectedIds.length > 0 ? '✅' : '❌') : '➗'}
            </Text>
            <Text className={`text-xs font-medium ${isMultiSelectMode ? (multiSelectedIds.length > 0 ? 'text-on-primary-container' : 'text-on-error-container') : 'text-on-surface-variant'}`}>
              {isMultiSelectMode ? (multiSelectedIds.length > 0 ? 'Next' : 'Cancel') : 'Split'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
