import { tokens } from '@/theme';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tokens.colors.surface.DEFAULT,
          borderTopColor: tokens.colors.border.DEFAULT,
          borderTopWidth: 1,
          elevation: 0,
        },
        tabBarActiveTintColor: tokens.colors.foreground.DEFAULT,
        tabBarInactiveTintColor: tokens.colors.foreground.muted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Ledger', tabBarIcon: () => <></> }} />
      <Tabs.Screen name="entry" options={{ title: 'Entry', tabBarIcon: () => <></> }} />
    </Tabs>
  );
}
