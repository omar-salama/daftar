import { TxLine } from '@/kernel';
import { Minor, formatMinor, DEFAULT_CURRENCY } from '@/kernel/money';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useCategories } from '../../categories/hooks';
import { Keypad } from './Keypad';
import { CategoryGrid } from './CategoryGrid';
import { SplitEditorRow } from './SplitEditorRow';
import { useSplitEditor } from '../hooks/useSplitEditor';

interface SplitEditorProps {
  totalMinor: Minor;
  initialCategoryIds?: string[];
  initialLines?: readonly TxLine[];
  onSave: (lines: TxLine[]) => void;
  onCancel: () => void;
}

export function SplitEditor(props: SplitEditorProps) {
  const { data: categories, isLoading } = useCategories();
  
  const {
    lines,
    activeLineId,
    isAddingCategory,
    remainingMinor,
    canSave,
    setIsAddingCategory,
    handleFocusLine,
    handleDigit,
    handleBackspace,
    handleAddCategory,
    handleRemoveLine,
    handleSave
  } = useSplitEditor(props);

  if (isLoading || !categories) {
    return (
      <View className="flex-1 p-4 bg-surface border-t border-surface-variant items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isAddingCategory) {
    return (
      <View className="flex-1 bg-surface border-t border-surface-variant">
        <View className="p-4 flex-row items-center justify-between">
          <Text className="text-on-surface text-lg font-medium">Add Split Category</Text>
          {lines.length > 0 && (
            <Pressable onPress={() => setIsAddingCategory(false)}>
              <Text className="text-primary font-medium">Cancel</Text>
            </Pressable>
          )}
        </View>
        <ScrollView className="flex-1">
          <CategoryGrid 
            txType="expense" 
            onSelectCategory={handleAddCategory} 
            onSplit={() => true} 
            isAddMode={true}
            disabledCategoryIds={lines.map(l => l.categoryId)}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface border-t border-surface-variant flex-col">
      <View className="p-4 flex-row justify-between items-center border-b border-surface-variant">
        <Text className="text-on-surface text-lg font-medium">
          Split Transaction
        </Text>
        <View className={`px-2 py-1 rounded-md ${remainingMinor === 0 ? 'bg-primary-container' : 'bg-error-container'}`}>
          <Text className={`font-medium ${remainingMinor === 0 ? 'text-on-primary-container' : 'text-on-error-container'}`}>
            {remainingMinor === 0 ? 'Balanced' : `${formatMinor(remainingMinor, DEFAULT_CURRENCY)} left`}
          </Text>
        </View>
      </View>
      
      <ScrollView className="flex-1 px-4">
        {lines.map((l) => (
          <SplitEditorRow
            key={l.id}
            id={l.id}
            digits={l.digits}
            isActive={l.id === activeLineId}
            category={categories.find(c => c.categoryId === l.categoryId)}
            onFocus={handleFocusLine}
            onRemove={handleRemoveLine}
          />
        ))}
        
        <Pressable 
          onPress={() => setIsAddingCategory(true)}
          className="flex-row items-center gap-2 py-4 mt-2 justify-center border border-dashed border-surface-variant rounded-xl active:bg-surface-container"
        >
          <Text className="text-on-surface-variant text-lg">➕</Text>
          <Text className="text-on-surface-variant font-medium">Add Category</Text>
        </Pressable>
        
        <View className="flex-row mt-6 gap-2 mb-4">
          <Pressable 
            onPress={props.onCancel} 
            className="flex-1 p-4 bg-surface-container-high rounded-xl items-center min-h-[44px]"
          >
            <Text className="text-on-surface font-medium">Cancel Split</Text>
          </Pressable>
          <Pressable 
            onPress={handleSave} 
            disabled={!canSave}
            className={`flex-1 p-4 rounded-xl items-center min-h-[44px] ${canSave ? 'bg-primary active:bg-primary-container' : 'bg-surface-variant opacity-50'}`}
          >
            <Text className={`${canSave ? 'text-on-primary' : 'text-on-surface-variant'} font-medium`}>Save Split</Text>
          </Pressable>
        </View>
      </ScrollView>
      
      <Keypad 
        onDigit={handleDigit}
        onBackspace={handleBackspace}
      />
    </View>
  );
}
