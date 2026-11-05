import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerTintColor: '#00234b', headerTitleStyle: { fontWeight: '700' } }}>
      <Stack.Screen name="index Settings" options={{ title: '' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacy' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="change-password" options={{ title: 'Change Password' }} />
      <Stack.Screen name="delete-account" options={{ title: 'Delete or Deactivate' }} />
      <Stack.Screen name="blocked" options={{ title: 'Blocked Users' }} />
      <Stack.Screen name="mute-report" options={{ title: 'Mute & Report' }} />
      <Stack.Screen name="invite" options={{ title: 'Invite Friends' }} />
      <Stack.Screen name="contact" options={{ title: 'Contact Us' }} />
      <Stack.Screen name="help" options={{ title: 'Help' }} />
    </Stack>
  );
}
