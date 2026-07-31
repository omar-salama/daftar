import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { AccountTypeId } from '../model';
import { useAccountTypes, useSaveAccountType } from './useAccountTypes';

export interface UseAccountTypeFormProps {
  accountTypeId?: string;
}

export function useAccountTypeForm({ accountTypeId }: UseAccountTypeFormProps) {
  const router = useRouter();
  
  const { data: accountTypes = [] } = useAccountTypes();
  const saveAccountType = useSaveAccountType();

  const existingAccountType = useMemo(() => 
    accountTypes.find(c => c.accountTypeId === accountTypeId),
  [accountTypes, accountTypeId]);

  const isEditing = !!existingAccountType;

  const [name, setName] = useState(existingAccountType?.name || '');
  const [isLiability, setIsLiability] = useState(existingAccountType?.isLiability || false);

  const handleSave = async () => {
    if (!name.trim()) return;

    await saveAccountType.mutateAsync({
      existingAccountType,
      name: name.trim(),
      isLiability,
      maxOrder: accountTypes.length > 0 ? Math.max(...accountTypes.map(c => c.order ?? 0)) : -1,
    });
    router.back();
  };

  return {
    isEditing,
    name, setName,
    isLiability, setIsLiability,
    handleSave,
    isPending: saveAccountType.isPending,
    router,
  };
}
