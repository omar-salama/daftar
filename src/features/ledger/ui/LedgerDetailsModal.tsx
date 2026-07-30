import { AccountVersion } from '@/features/accounts/model';
import { CategoryVersion } from '@/features/categories/model';
import { DEFAULT_CURRENCY, TxVersion } from '@/kernel';
import { formatMinor } from '@/kernel/money';
import { Modal, Pressable, Text, View } from 'react-native';

interface LedgerDetailsModalProps {
  selectedTx: TxVersion | null;
  accounts: AccountVersion[];
  categories: CategoryVersion[];
  onClose: () => void;
  onEdit: (tx: TxVersion) => void;
  onDelete: (tx: TxVersion) => void;
}

export function LedgerDetailsModal({
  selectedTx,
  accounts,
  categories,
  onClose,
  onEdit,
  onDelete,
}: LedgerDetailsModalProps) {
  if (!selectedTx) return null;

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find(c => c.categoryId === categoryId);
    if (!cat) return categoryId;
    if (cat.parentId) {
      const parent = categories.find(c => c.categoryId === cat.parentId);
      if (parent) return `${parent.name} - ${cat.name}`;
    }
    return cat.name;
  };

  const accountName = accounts.find(a => a.accountId === selectedTx.accountId)?.name || selectedTx.accountId;
  const transferAccountName = accounts.find(a => a.accountId === selectedTx.transferAccountId)?.name || selectedTx.transferAccountId;

  const subtitle = selectedTx.type === 'transfer'
    ? `${accountName} → ${transferAccountName}`
    : `${accountName} • ${selectedTx.occurredAt} • ${selectedTx.type === 'income' ? '💰 ' : ''}${selectedTx.lines.length > 1 ? 'Split Transaction' : getCategoryName(selectedTx.lines[0]?.categoryId)}`;

  return (
    <Modal
      transparent
      animationType="slide"
      visible={!!selectedTx}
      onRequestClose={onClose}
    >
      <Pressable 
        className="flex-1 bg-black/60 justify-end"
        onPress={onClose}
      >
        <Pressable 
          className="bg-surface-container-highest rounded-t-3xl p-6 pb-10"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="items-center mb-6">
            <View className="w-12 h-1 bg-outline rounded-full" />
          </View>

          <Text className="text-on-surface text-xl font-semibold mb-1 text-center font-mono">
            {selectedTx.type === 'income' ? '+' : ''}{formatMinor(selectedTx.totalMinor, DEFAULT_CURRENCY)}
          </Text>
          
          <Text className="text-on-surface-variant text-sm mb-8 text-center font-sans">
            {subtitle}
          </Text>

          <View className="gap-3">
            <Pressable
              className="bg-primary py-3.5 rounded-full items-center"
              onPress={() => onEdit(selectedTx)}
            >
              <Text className="text-on-primary font-semibold text-base font-sans">Edit</Text>
            </Pressable>
            
            <Pressable
              className="bg-surface-container-highest border border-error py-3.5 rounded-full items-center"
              onPress={() => onDelete(selectedTx)}
            >
              <Text className="text-error font-semibold text-base font-sans">Delete</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
