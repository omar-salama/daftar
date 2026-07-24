import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Ledger', tabBarIcon: () => <></> }} />
      <Tabs.Screen name="entry" options={{ title: 'Entry', tabBarIcon: () => <></> }} />
    </Tabs>
  );
}
