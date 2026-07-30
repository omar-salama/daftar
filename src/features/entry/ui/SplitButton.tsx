import { Pressable, Text, View } from "react-native";

type SplitButtonProps = {
    isMultiSelectMode: boolean;
    selectedCount: number;
    onPress: () => void;
};

export function SplitButton({
    isMultiSelectMode,
    selectedCount,
    onPress,
}: SplitButtonProps) {
    const isValidSelection = selectedCount > 1;

    const icon = isMultiSelectMode
        ? isValidSelection
            ? '✅'
            : '❌'
        : '➗';

    const label = isMultiSelectMode
        ? isValidSelection
            ? 'Next'
            : 'Cancel'
        : 'Split';

    const className = isMultiSelectMode
        ? isValidSelection
            ? 'bg-primary-container border-primary'
            : 'bg-error-container border-error'
        : 'bg-surface-container border-transparent';

    const textClassName = isMultiSelectMode
        ? isValidSelection
            ? 'text-on-primary-container'
            : 'text-on-error-container'
        : 'text-on-surface-variant';

    return (
        <View className="w-1/4 px-0.5 pt-1">
            <Pressable
                onPress={onPress}
                className={`items-center justify-center gap-1 rounded border p-2 min-h-[52px] flex-col active:opacity-70 ${className}`}
            >
                <Text className="text-lg">{icon}</Text>
                <Text className={`text-xs font-medium ${textClassName}`}>
                    {label}
                </Text>
            </Pressable>
        </View>
    );
}