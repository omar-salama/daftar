import { useLocalSearchParams } from 'expo-router';
import { AccountForm } from '@/features/accounts/ui';

export default function AccountFormScreen() {
  const { accountId } = useLocalSearchParams<{ accountId?: string }>();
  return <AccountForm accountId={accountId} />;
}
