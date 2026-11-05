import { Pressable, Text, View } from 'react-native';

import type { ChatRoom } from '@/api/chat';

import { Avatar } from './avatar';
import { formatTime } from './format';

export function RoomRow({ room, onPress }: { room: ChatRoom; onPress: () => void }) {
  const unseen = room.unseen_message_count ?? 0;
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 border-b border-border px-4 py-3 active:bg-surface"
    >
      <Avatar uri={room.image} />
      <View className="flex-1">
        <Text className="text-base font-semibold text-ink" numberOfLines={1}>
          {room.chat_name ?? 'Conversation'}
        </Text>
        <Text className="text-sm text-muted" numberOfLines={1}>
          {room.latest_message ?? 'No messages yet'}
        </Text>
      </View>
      <View className="items-end gap-1">
        <Text className="text-xs text-muted">{formatTime(room.date_modified)}</Text>
        {unseen > 0 ? (
          <View className="min-w-5 items-center rounded-full bg-accent px-1.5 py-0.5">
            <Text className="text-xs font-bold text-white">{unseen}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
