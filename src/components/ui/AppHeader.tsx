import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export type ActionConfig = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

interface AppHeaderProps {
  title: string;
  leftAction?: ActionConfig;
  rightAction?: ActionConfig;
  className?: string;
}

export function AppHeader({
  title,
  leftAction,
  rightAction,
  className = '',
}: AppHeaderProps) {
  const router = useRouter();
  
  const handleLeftPress = leftAction?.onPress || (() => router.back());

  const renderAction = (action?: ActionConfig, isLeft?: boolean) => {
    if (!action && isLeft) {
      // Default left action if none is provided
      return <Text className="text-on-surface-variant text-base font-medium">‹ Back</Text>;
    }
    
    if (!action) return null;

    if (action.label) {
      const colorClass = action.disabled 
        ? 'text-on-surface-variant' 
        : (isLeft ? 'text-on-surface-variant' : 'text-primary'); 
        
      const isIcon = action.label.length <= 2;
      const fontClass = isIcon 
        ? 'text-3xl font-semibold' 
        : (isLeft ? 'text-base font-medium' : 'text-base font-semibold');
      
      return (
        <Text className={`${fontClass} ${colorClass}`}>
          {action.label}
        </Text>
      );
    }

    return null;
  };

  return (
    <View className={`flex-row items-center justify-between h-12 px-4 border-b border-surface-container ${className}`}>
      {/* Left action */}
      <View className="w-24">
        <Pressable 
          onPress={handleLeftPress} 
          className="flex-row items-center" 
          hitSlop={8}
          disabled={leftAction?.disabled}
        >
          {renderAction(leftAction, true)}
        </Pressable>
      </View>

      {/* Center title */}
      <View className="flex-1 items-center">
        <Text className="text-lg font-bold text-on-surface" numberOfLines={1}>
          {title}
        </Text>
      </View>

      {/* Right action */}
      <View className="w-24 items-end">
        {rightAction && (
          <Pressable
            onPress={rightAction.onPress}
            className="items-center justify-center"
            hitSlop={8}
            disabled={rightAction.disabled}
          >
            {renderAction(rightAction, false)}
          </Pressable>
        )}
      </View>
    </View>
  );
}
