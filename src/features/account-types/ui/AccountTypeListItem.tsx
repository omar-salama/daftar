import { useRouter } from 'expo-router';
import { DraggableListItem } from '@/components/ui/DraggableListItem';
import { AccountTypeVersion } from '../model';

export interface AccountTypeListItemProps {
  item: AccountTypeVersion;
  isActive: boolean;
  drag: () => void;
  onDelete: (item: AccountTypeVersion) => void;
  containerClassName?: string;
}

export function AccountTypeListItem({
  item,
  isActive,
  drag,
  onDelete,
  containerClassName = 'bg-surface'
}: AccountTypeListItemProps) {
  const router = useRouter();

  return (
    <DraggableListItem
      title={item.name}
      icon={item.icon}
      isActive={isActive}
      drag={drag}
      onDelete={() => onDelete(item)}
      onPress={() => router.push(`/account-type-form?accountTypeId=${item.accountTypeId}`)}
      entityName="Account Type"
      badges={item.isLiability ? ['Liability'] : undefined}
      containerClassName={containerClassName}
    />
  );
}
