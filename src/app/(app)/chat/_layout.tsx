import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack screenOptions={{ headerTintColor: '#00234b' }}>
      <Stack.Screen name="index" options={{ title: 'Messages' }} />
      <Stack.Screen name="new" options={{ title: 'New message' }} />
      <Stack.Screen name="requests" options={{ title: 'Message requests' }} />
      <Stack.Screen name="[roomId]" options={{ title: 'Chat' }} />
    </Stack>
  );
}
