import { AppHeader } from '@/components/ui/AppHeader';
import { useAccountTypes, useDeleteAccountType } from '@/features/account-types/hooks';
import { AccountTypeVersion } from '@/features/account-types/model';
import { AccountTypeListItem, DraggableAccountTypeList } from '@/features/account-types/ui';
import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { NestableScrollContainer, RenderItemParams } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountTypeManagementScreen() {
  const router = useRouter();

  const { data: accountTypes = [] } = useAccountTypes();
  const deleteAccountType = useDeleteAccountType();

  const data = useMemo(() => {
    return [...accountTypes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [accountTypes]);

  const renderItem = ({ item, drag, isActive }: RenderItemParams<AccountTypeVersion>) => {
    return (
      <AccountTypeListItem
        item={item}
        isActive={isActive}
        drag={drag}
        onDelete={(item) => deleteAccountType.mutate(item)}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <AppHeader
        title="Account Types"
        rightAction={{ label: "+", onPress: () => router.push(`/account-type-form`) }}
      />
      <View className="flex-1">
        {data.length === 0 ? (
          <Text className="text-on-surface-variant text-center mt-8 mb-4">No account types found.</Text>
        ) : (
          <NestableScrollContainer>
            <DraggableAccountTypeList
              accountTypes={data}
              onDelete={(item) => deleteAccountType.mutate(item)}
              renderItem={renderItem}
            />
          </NestableScrollContainer>
        )}
      </View>
    </SafeAreaView>
  );
}
