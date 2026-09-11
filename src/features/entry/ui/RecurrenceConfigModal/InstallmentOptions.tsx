import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

export function InstallmentOptions({
  localInstallmentCount,
  setLocalInstallmentCount,
}: {
  localInstallmentCount: string;
  setLocalInstallmentCount: (val: string) => void;
}) {
  const isPreset = ['3', '6', '12', '24'].includes(localInstallmentCount);
  const [isCustom, setIsCustom] = useState(!isPreset);

  return (
    <View className="gap-y-4 px-1">
      <View className="flex-row gap-2">
        {[3, 6, 12, 24, 'Custom'].map((preset) => {
          const isCustomPreset = preset === 'Custom';
          const isSelected = isCustomPreset
            ? isCustom
            : !isCustom && parseInt(localInstallmentCount, 10) === preset;

          return (
            <Pressable
              key={preset}
              className={`py-3 rounded-xl border items-center flex-1 ${
                isSelected
                  ? 'bg-primary border-primary'
                  : 'bg-surface-container border-surface-variant'
              }`}
              onPress={() => {
                if (isCustomPreset) {
                  setIsCustom(true);
                } else {
                  setIsCustom(false);
                  setLocalInstallmentCount(preset.toString());
                }
              }}
            >
              <Text
                className={`font-medium ${
                  isSelected ? 'text-surface' : 'text-on-surface'
                }`}
              >
                {preset}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isCustom && (
        <View className="flex-row items-center bg-surface-container rounded-xl border border-surface-variant h-12 px-4">
          <TextInput
            className="flex-1 text-on-surface text-lg font-mono h-full"
            style={{ lineHeight: 0 }}
            keyboardType="number-pad"
            value={localInstallmentCount}
            onChangeText={setLocalInstallmentCount}
            maxLength={3}
          />
          <Text className="text-on-surface-variant text-sm font-semibold uppercase tracking-wider ml-2">
            Months
          </Text>
        </View>
      )}
    </View>
  );
}
