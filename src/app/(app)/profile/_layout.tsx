import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerTintColor: '#00234b', headerTitleStyle: { fontWeight: '700' } }}>
      <Stack.Screen name="edit" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="setup" options={{ title: 'Profile Setup' }} />
      <Stack.Screen name="followers" options={{ title: 'Followers' }} />
      <Stack.Screen name="following" options={{ title: 'Following' }} />
    </Stack>
  );
}
