import { useReorderAccountTypes } from '../hooks';
import { AccountTypeVersion } from '../model';
import { AccountTypeListItem } from './AccountTypeListItem';
import { DraggableList } from '@/components/ui/DraggableList';

export interface DraggableAccountTypeListProps {
  accountTypes: AccountTypeVersion[];
  onDelete: (item: AccountTypeVersion) => void;
  withDividers?: boolean;
  containerClassName?: string;
  renderItemContent?: (params: import('react-native-draggable-flatlist').RenderItemParams<AccountTypeVersion>) => React.ReactNode;
}

export function DraggableAccountTypeList({
  accountTypes,
  onDelete,
  withDividers = false,
  containerClassName,
  renderItemContent,
}: DraggableAccountTypeListProps) {
  const reorderAccountTypes = useReorderAccountTypes();

  return (
    <DraggableList
      items={accountTypes}
      onReorder={(data) => reorderAccountTypes.mutate(data)}
      keyExtractor={(item) => item.accountTypeId}
      withDividers={withDividers}
      renderItemContent={(params) => 
        renderItemContent ? renderItemContent(params) : (
          <AccountTypeListItem
            item={params.item}
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
