import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform, useColorScheme } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  if (Platform.OS === 'web') {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: isDark ? "#1d2027" : "#ffffff",
            borderTopColor: isDark ? "#32353c" : "#e4e4e7",
            borderTopWidth: 1,
            elevation: 0,
          },
          tabBarActiveTintColor: isDark ? "#e1e2ec" : "#09090b",
          tabBarInactiveTintColor: isDark ? "#c2c6d6" : "#52525b",
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Ledger', tabBarIcon: () => <></> }} />
        <Tabs.Screen name="accounts" options={{ title: 'Accounts', tabBarIcon: () => <></> }} />
        <Tabs.Screen name="entry" options={{ title: 'Entry', tabBarIcon: () => <></>, href: '/entry' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: () => <></> }} />
      </Tabs>
    );
  }

  return (
    <NativeTabs
      tintColor={isDark ? "#e1e2ec" : "#09090b"}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Ledger</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'book', selected: 'book.fill' }} md="import_contacts" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="accounts">
        <NativeTabs.Trigger.Label>Accounts</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'wallet.bifold', selected: 'wallet.bifold.fill' }} md="wallet" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="entry">
        <NativeTabs.Trigger.Label>Entry</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'plus.circle', selected: 'plus.circle.fill' }} md="add_circle" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'gear', selected: 'gear' }} md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
