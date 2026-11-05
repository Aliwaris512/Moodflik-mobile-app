import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerTintColor: '#00234b', headerTitleStyle: { fontWeight: '700' } }}>
      <Stack.Screen name="[id] Profile" options={{ title: '' }} />
      <Stack.Screen name="search" options={{ title: 'Find People' }} />
    </Stack>
  );
}
