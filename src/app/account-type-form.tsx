import { useLocalSearchParams } from 'expo-router';
import { AccountTypeForm } from '@/features/account-types/ui/AccountTypeForm';

export default function AccountTypeFormScreen() {
  const { accountTypeId } = useLocalSearchParams<{ accountTypeId?: string }>();
  return <AccountTypeForm accountTypeId={accountTypeId} />;
}
