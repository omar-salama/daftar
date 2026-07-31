import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NestableDraggableFlatList, RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

export interface DraggableListProps<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  keyExtractor: (item: T) => string;
  renderItemContent: (params: RenderItemParams<T>) => React.ReactNode;
  withDividers?: boolean;
}

export function DraggableList<T>({
  items: initialItems,
  onReorder,
  keyExtractor,
  renderItemContent,
  withDividers = false,
}: DraggableListProps<T>) {
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const handleDragEnd = ({ data }: { data: T[] }) => {
    setItems(data);
    onReorder(data);
  };

  const renderItem = (params: RenderItemParams<T>) => {
    const index = params.getIndex() ?? 0;
    const showDivider = withDividers && index < items.length - 1;
    
    return (
      <ScaleDecorator>
        <View className={showDivider ? 'border-b border-surface-variant' : ''}>
          {renderItemContent(params)}
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <NestableDraggableFlatList
      data={items}
      onDragEnd={handleDragEnd}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
    />
  );
}
