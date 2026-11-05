import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRooms } from '@/api/chat';
import { useChatSocket } from '@/api/chat/socket';
import { Composer } from '@/components/chat/composer';
import { MessageBubble } from '@/components/chat/message-bubble';
import { useRoomMessages } from '@/db/messages';
import { useMyUserId } from '@/lib/me';

export default function Conversation() {
  const { roomId, name } = useLocalSearchParams<{ roomId: string; name?: string }>();
  const me = useMyUserId();
  const rooms = useRooms();

  const peer = useMemo(
    () =>
      rooms.data?.find((r) => r.room_id === roomId)?.participants.user.find((u) => u.uuid !== me)
        ?.uuid,
    [rooms.data, roomId, me],
  );

  const { state, online, error, send } = useChatSocket(roomId, peer);
  const messages = useRoomMessages(roomId);
  const peerOnline = peer ? online.includes(peer) : false;

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-white">
      <Stack.Screen options={{ title: name ?? 'Chat' }} />
      {state !== 'open' ? (
        <Text className="bg-surface py-1 text-center text-xs text-muted">
          {state === 'connecting' ? 'Connecting…' : 'Offline, retrying…'}
        </Text>
      ) : peerOnline ? (
        <Text className="bg-surface py-1 text-center text-xs text-accent">Active now</Text>
      ) : null}
      {error ? <Text className="px-4 py-1 text-center text-xs text-danger">{error}</Text> : null}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          inverted
          className="flex-1"
          contentContainerClassName="px-4 py-3"
          data={messages.toReversed()}
          keyExtractor={(m) => m.uuid}
          renderItem={({ item }) => <MessageBubble message={item} mine={item.user === me} />}
          ListEmptyComponent={
            <View className="scale-y-[-1] items-center py-16">
              <Text className="text-muted">Say hello 👋</Text>
            </View>
          }
        />
        <Composer onSend={send} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
