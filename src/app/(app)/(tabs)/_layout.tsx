import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { MenuButton } from '@/components/shell/menu';

type IconName = keyof typeof Ionicons.glyphMap;

const icon =
  (name: IconName, focused: IconName) =>
  ({
    color,
    size,
    focused: isFocused,
  }: {
    color: ColorValue | string;
    size: number;
    focused: boolean;
  }) => <Ionicons name={isFocused ? focused : name} size={size} color={String(color)} />;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerLeft: () => <MenuButton />,
        headerTintColor: '#00234b',
        tabBarActiveTintColor: '#00234b',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Home', tabBarIcon: icon('home-outline', 'home') }}
      />
      <Tabs.Screen
        name="create"
        options={{ title: 'Post', tabBarIcon: icon('add-circle-outline', 'add-circle') }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ title: 'Alerts', tabBarIcon: icon('notifications-outline', 'notifications') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: icon('person-outline', 'person') }}
      />
    </Tabs>
  );
}
