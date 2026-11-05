import { Stack } from 'expo-router';

import { MenuProvider } from '@/components/shell/menu';

export default function AppLayout() {
  return (
    <MenuProvider>
      <Stack screenOptions={{ headerTintColor: '#00234b' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="legal" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="user" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ title: 'Search' }} />
        <Stack.Screen name="post/[id]" options={{ title: 'Post' }} />
        <Stack.Screen name="post/edit/[id]" options={{ title: 'Edit post' }} />
        <Stack.Screen name="post/favourites" options={{ title: 'Favourites' }} />
        <Stack.Screen name="post/mine" options={{ title: 'My posts' }} />
        <Stack.Screen name="comments/[postId]" options={{ title: 'Comments' }} />
        <Stack.Screen name="thread/[postId]" options={{ title: 'Ask why' }} />
        <Stack.Screen name="thread/chat/[threadId]" options={{ title: 'Thread' }} />
      </Stack>
    </MenuProvider>
  );
}
