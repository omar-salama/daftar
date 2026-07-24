import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#09090b',
          borderTopColor: '#18181b',
          borderTopWidth: 1,
          elevation: 0,
        },
        tabBarActiveTintColor: '#f4f4f5',
        tabBarInactiveTintColor: '#71717a',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Ledger', tabBarIcon: () => <></> }} />
      <Tabs.Screen name="entry" options={{ title: 'Entry', tabBarIcon: () => <></> }} />
    </Tabs>
  );
}
