import { SafeAreaView } from 'react-native-safe-area-context';
import { LedgerList } from '@/features/ledger/ui/LedgerList';

export default function LedgerTab() {
  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top', 'left', 'right']}>
      <LedgerList />
    </SafeAreaView>
  );
}
