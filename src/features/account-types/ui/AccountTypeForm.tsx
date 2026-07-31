import { AppHeader } from '@/components/ui/AppHeader';
import { useNavigation } from 'expo-router';
import { useEffect, useRef } from 'react';
import { TextInput, View, Text } from 'react-native';
import { NestableScrollContainer } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccountTypeForm, UseAccountTypeFormProps } from '../hooks/useAccountTypeForm';

export function AccountTypeForm({ accountTypeId }: UseAccountTypeFormProps) {
  const {
    isEditing,
    name, setName,
    handleSave,
    isPending,
    router,
  } = useAccountTypeForm({ accountTypeId });

  const navigation = useNavigation();
  const nameInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isEditing) return;
    // @ts-ignore
    const unsubscribe = navigation.addListener('transitionEnd', (e) => {
      nameInputRef.current?.focus();
    });
    return unsubscribe;
  }, [navigation]);

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
      </NestableScrollContainer>
    </SafeAreaView>
  );
}
