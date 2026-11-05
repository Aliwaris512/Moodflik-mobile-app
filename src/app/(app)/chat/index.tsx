import { Ionicons } from '@expo/vector-icons';
import { Link, router, Stack } from 'expo-router';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { useDmRequests, useRooms } from '@/api/chat';
import { RoomRow } from '@/components/chat/room-row';
import { Loader } from '@/components/ui';

export default function ChatList() {
  const rooms = useRooms();
  const requests = useDmRequests();
  const pending = requests.data?.length ?? 0;

  if (rooms.isLoading) return <Loader />;

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{
          headerRight: () => (
            <Link href="/chat/new" asChild>
              <Pressable hitSlop={8}>
                <Ionicons name="create-outline" size={24} color="#00234b" />
              </Pressable>
            </Link>
          ),
        }}
      />
      {pending > 0 ? (
        <Link href="/chat/requests" asChild>
          <Pressable className="flex-row items-center justify-between bg-surface px-4 py-3">
            <Text className="font-semibold text-brand">Message requests</Text>
            <View className="rounded-full bg-accent px-2 py-0.5">
              <Text className="text-xs font-bold text-white">{pending}</Text>
            </View>
          </Pressable>
        </Link>
      ) : null}
      <FlatList
        data={rooms.data ?? []}
        keyExtractor={(room) => room.uuid}
        refreshControl={
          <RefreshControl
            refreshing={rooms.isRefetching}
            onRefresh={() => {
              void rooms.refetch();
              void requests.refetch();
            }}
          />
        }
        renderItem={({ item }) => (
          <RoomRow
            room={item}
            onPress={() =>
              router.push({
                pathname: '/chat/[roomId]',
                params: { roomId: item.room_id ?? item.uuid, name: item.chat_name ?? 'Chat' },
              })
            }
          />
        )}
        ListEmptyComponent={
          <Text className="mt-16 text-center text-muted">No conversations yet.</Text>
        }
      />
    </View>
  );
}
