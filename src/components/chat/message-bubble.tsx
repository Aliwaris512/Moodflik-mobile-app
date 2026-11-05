import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { parseMessage } from '@/api/chat';
import type { MessageRow } from '@/db/messages';

import { formatTime } from './format';
import { SharedPost } from './shared-post';

export function MessageBubble({ message, mine }: { message: MessageRow; mine: boolean }) {
  const parsed = parseMessage(message.message);
  const seen = mine && message.seenBy.some((id) => id !== message.user);
  return (
    <View className={`mb-2 max-w-[80%] ${mine ? 'self-end' : 'self-start'}`}>
      <View
        className={`rounded-2xl px-3 py-2 ${mine ? 'rounded-br-sm bg-brand' : 'rounded-bl-sm bg-surface'} ${
          message.pending ? 'opacity-60' : ''
        }`}
      >
        {parsed.kind === 'text' ? (
          <Text className={mine ? 'text-white' : 'text-ink'}>{parsed.text}</Text>
        ) : parsed.kind === 'image' ? (
          <Image
            source={{ uri: parsed.url }}
            style={{ width: 220, height: 220, borderRadius: 12 }}
            contentFit="cover"
          />
        ) : (
          <SharedPost postId={parsed.postId} />
        )}
      </View>
      <Text className={`mt-0.5 text-[11px] text-muted ${mine ? 'text-right' : ''}`}>
        {message.pending ? 'Sending…' : formatTime(message.datetime)}
        {seen ? ' · Seen' : ''}
      </Text>
    </View>
  );
}
