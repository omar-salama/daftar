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

  const getCategoryDetails = (categoryId: string) => {
    const cat = categories.find(c => c.categoryId === categoryId);
    if (!cat) return { name: categoryId, icon: '❓' };
    if (cat.parentId) {
      const parent = categories.find(c => c.categoryId === cat.parentId);
      if (parent) return { name: `${parent.name} - ${cat.name}`, icon: cat.icon };
    }
    return { name: cat.name, icon: cat.icon };
  };

  const accountName = accounts.find(a => a.accountId === selectedTx.accountId)?.name || selectedTx.accountId;
  const transferAccountName = accounts.find(a => a.accountId === selectedTx.transferAccountId)?.name || selectedTx.transferAccountId;

  const subtitle = selectedTx.type === 'transfer'
    ? `${accountName} → ${transferAccountName}`
    : `${accountName} • ${selectedTx.occurredAt} • ${selectedTx.type === 'income' ? '💰 ' : ''}${selectedTx.lines.length > 1 ? 'Split Transaction' : getCategoryDetails(selectedTx.lines[0]?.categoryId).name}`;

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
          
          <Text className="text-on-surface-variant text-sm mb-6 text-center font-sans">
            {subtitle}
          </Text>

          {(selectedTx.payee || selectedTx.note || selectedTx.lines.length > 1) && (
            <View className="mb-6 w-full bg-surface rounded-xl p-4 gap-4 border border-surface-variant">
              {selectedTx.payee && (
                <View>
                  <Text className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Payee</Text>
                  <Text className="text-on-surface text-base font-medium">{selectedTx.payee}</Text>
                </View>
              )}
              {selectedTx.note && (
                <View>
                  <Text className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Note</Text>
                  <Text className="text-on-surface text-base">{selectedTx.note}</Text>
                </View>
              )}
              {selectedTx.lines.length > 1 && (
                <View>
                  <Text className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Split Breakdown</Text>
                  <View className="gap-2">
                    {selectedTx.lines.map((l, i) => {
                      const catDetails = getCategoryDetails(l.categoryId);
                      return (
                        <View key={i} className="flex-row justify-between items-center bg-surface-container p-2 rounded-lg">
                          <Text className="text-on-surface font-medium">{catDetails.icon} {catDetails.name}</Text>
                          <Text className="text-on-surface font-mono font-medium text-sm">{formatMinor(l.amountMinor, DEFAULT_CURRENCY)}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}

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
