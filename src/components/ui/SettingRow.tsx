import { Href, Link } from 'expo-router';
import { Pressable, Text } from 'react-native';

interface SettingRowProps {
  label: string;
  href?: Href;
  onPress?: () => void;
}

export function SettingRow({ label, href, onPress }: SettingRowProps) {
  const content = (
    <Pressable 
      onPress={onPress}
      className="px-4 py-3 bg-surface border-b border-surface-container active:bg-surface-container-high flex-row items-center justify-between"
    >
      <Text className="text-on-surface text-lg">{label}</Text>
    </Pressable>
  );

  if (href) {
    return (
      <Link href={href} asChild>
        {content}
      </Link>
    );
  }

  return content;
}
