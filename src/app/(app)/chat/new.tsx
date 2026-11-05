import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';

import { type ChatUser, useRooms, useSendDmRequest, useUserSearch } from '@/api/chat';
import { Avatar } from '@/components/chat/avatar';
import { Button } from '@/components/ui';

export default function NewMessage() {
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState<ChatUser | null>(null);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const users = useUserSearch(search);
  const rooms = useRooms();
  const request = useSendDmRequest();

  const choose = (user: ChatUser) => {
    const existing = rooms.data?.find((r) => r.participants.user.some((p) => p.uuid === user.uuid));
    if (existing?.room_id) {
      router.replace({
        pathname: '/chat/[roomId]',
        params: { roomId: existing.room_id, name: existing.chat_name ?? user.username },
      });
      return;
    }
    setTarget(user);
  };

  const sendRequest = () => {
    if (!target) return;
    request.mutate(
      { type: 'private', receiver: target.uuid, message: message.trim() },
      {
        onSuccess: ({ data }) => {
          setNotice(data);
          setTimeout(() => router.back(), 1200);
        },
        onError: () => setNotice('Could not send the request. Try again.'),
      },
    );
  };

  if (target) {
    return (
      <View className="flex-1 gap-4 bg-white p-5">
        <View className="flex-row items-center gap-3">
          <Avatar uri={target.photo_url} />
          <Text className="text-lg font-semibold text-ink">
            {target.first_name} {target.last_name}
          </Text>
        </View>
        <Text className="text-sm text-muted">
          You haven&apos;t chatted yet. They&apos;ll get your message as a request.
        </Text>
        <TextInput
          className="min-h-24 rounded-xl border border-border p-3 text-base text-ink"
          placeholder="Write a message"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={255}
        />
        {notice ? <Text className="text-center text-brand-2">{notice}</Text> : null}
        <Button
          title="Send request"
          loading={request.isPending}
          disabled={!message.trim()}
          onPress={sendRequest}
        />
        <Button title="Back" variant="ghost" onPress={() => setTarget(null)} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <TextInput
        className="m-4 rounded-xl bg-surface px-4 py-3 text-base text-ink"
        placeholder="Search people"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoFocus
      />
      {users.isFetching ? <ActivityIndicator /> : null}
      <FlatList
        data={users.data ?? []}
        keyExtractor={(u) => u.uuid}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            onPress={() => choose(item)}
            className="flex-row items-center gap-3 px-4 py-3 active:bg-surface"
          >
            <Avatar uri={item.photo_url} size={40} />
            <View>
              <Text className="font-semibold text-ink">
                {item.first_name} {item.last_name}
              </Text>
              <Text className="text-sm text-muted">@{item.username}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
