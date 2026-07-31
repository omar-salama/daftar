import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NestableDraggableFlatList, RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useReorderAccountTypes } from '../hooks';
import { AccountTypeVersion } from '../model';
import { AccountTypeListItem } from './AccountTypeListItem';

export interface DraggableAccountTypeListProps {
  accountTypes: AccountTypeVersion[];
  onDelete: (item: AccountTypeVersion) => void;
  withDividers?: boolean;
  containerClassName?: string;
  renderItem?: (params: RenderItemParams<AccountTypeVersion>) => React.ReactNode;
}

export function DraggableAccountTypeList({
  accountTypes: initialAccountTypes,
  onDelete,
  withDividers = false,
  containerClassName,
  renderItem,
}: DraggableAccountTypeListProps) {
  const [accountTypes, setAccountTypes] = useState(initialAccountTypes);
  const reorderAccountTypes = useReorderAccountTypes();

  useEffect(() => {
    setAccountTypes(initialAccountTypes);
  }, [initialAccountTypes]);

  const handleDragEnd = ({ data }: { data: AccountTypeVersion[] }) => {
    setAccountTypes(data);
    reorderAccountTypes.mutate(data);
  };

  const defaultRenderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<AccountTypeVersion>) => {
    const index = getIndex() ?? 0;
    const showDivider = withDividers && index < accountTypes.length - 1;
    
    return (
      <ScaleDecorator>
        <View className={showDivider ? 'border-b border-surface-variant' : ''}>
          <AccountTypeListItem
            item={item}
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
      data={accountTypes}
      onDragEnd={handleDragEnd}
      keyExtractor={(item) => item.accountTypeId}
      renderItem={renderItem ?? defaultRenderItem}
    />
  );
}
