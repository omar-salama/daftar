import { AppHeader } from '@/components/ui/AppHeader';
import { useAutoFocus } from '@/hooks/useAutoFocus';
import { useRef } from 'react';
import { Switch, Text, TextInput, View } from 'react-native';
import { NestableScrollContainer } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccountTypeForm, UseAccountTypeFormProps } from '../hooks/useAccountTypeForm';

export function AccountTypeForm({ accountTypeId }: UseAccountTypeFormProps) {
  const {
    isEditing,
    name, setName,
    isLiability, setIsLiability,
    handleSave,
    isPending,
    router,
  } = useAccountTypeForm({ accountTypeId });

  const nameInputRef = useRef<TextInput>(null);
  useAutoFocus(nameInputRef);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <AppHeader
        className="mb-6"
        title={isEditing ? 'Edit Account Type' : 'New Account Type'}
        leftAction={{ label: 'Cancel', onPress: () => router.back() }}
        rightAction={{
          label: 'Save',
          onPress: handleSave,
          disabled: !name.trim() || isPending
        }}
      />

      <NestableScrollContainer className='flex-1' contentContainerClassName="px-4 gap-6" keyboardShouldPersistTaps="handled">
        <View className="flex-1">
          <Text className="text-sm font-medium text-on-surface-variant mb-2">Account Type Name</Text>
          <TextInput
            ref={nameInputRef}
            className="bg-surface-container text-on-surface rounded-xl border border-surface-variant px-3 py-3"
            placeholder="e.g. PayPal"
            placeholderTextColor="#71717a"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View className="flex-row items-center justify-between bg-surface-container rounded-xl border border-surface-variant p-4">
          <View className="flex-1 mr-4">
            <Text className="text-base font-semibold text-on-surface">Is Liability?</Text>
            <Text className="text-sm text-on-surface-variant mt-1">
              Mark this if accounts of this type represent debt or money you owe (e.g., Credit Cards).
            </Text>
          </View>
          <Switch
            value={isLiability}
            onValueChange={setIsLiability}
          />
        </View>
      </NestableScrollContainer>
    </SafeAreaView>
  );
}
