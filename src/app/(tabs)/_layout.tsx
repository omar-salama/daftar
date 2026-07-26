import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#1d2027' : '#ffffff',
          borderTopColor: isDark ? '#32353c' : '#e4e4e7',
          borderTopWidth: 1,
          elevation: 0,
        },
        tabBarActiveTintColor: isDark ? '#e1e2ec' : '#09090b',
        tabBarInactiveTintColor: isDark ? '#c2c6d6' : '#52525b',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Ledger', tabBarIcon: () => <></> }} />
      <Tabs.Screen name="accounts" options={{ title: 'Accounts', tabBarIcon: () => <></> }} />
      <Tabs.Screen name="entry" options={{ title: 'Entry', tabBarIcon: () => <></>, href: '/entry' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: () => <></> }} />
    </Tabs>
  );
}
