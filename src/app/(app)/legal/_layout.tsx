import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerTintColor: '#00234b', headerTitleStyle: { fontWeight: '700' } }}>
      <Stack.Screen name="index" options={{ title: 'About & Legal' }} />
      <Stack.Screen name="[slug]" options={{ title: '' }} />
    </Stack>
  );
}
