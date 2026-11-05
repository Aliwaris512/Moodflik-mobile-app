import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { type Href, router } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { api } from '@/api/client';
import type { PostShow } from '@/api/generated/types.gen';

/** Compact preview of a post shared inside a conversation (`[<id>][post]`). */
export function SharedPost({ postId }: { postId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['chat', 'shared-post', postId],
    queryFn: async () => (await api.get<PostShow>(`post_by_id/${postId}`)).data,
  });

  if (isLoading) return <ActivityIndicator />;
  if (!data) return <Text className="text-sm italic text-muted">Post unavailable</Text>;

  const media = typeof data.media_url === 'string' ? data.media_url : null;
  return (
    <Pressable
      onPress={() => router.push(`/post/${postId}` as Href)}
      className="w-60 overflow-hidden rounded-xl border border-border bg-white"
    >
      {media && data.content_type?.startsWith('image') ? (
        <Image source={{ uri: media }} style={{ width: '100%', height: 140 }} contentFit="cover" />
      ) : null}
      <View className="p-2">
        <Text className="text-xs font-semibold uppercase text-brand-2">
          {data.post_type === 'like' ? 'Likes' : 'Dislikes'} · {data.first_name} {data.last_name}
        </Text>
        <Text className="mt-1 text-sm text-ink" numberOfLines={3}>
          {data.content ?? data.why_content ?? ''}
        </Text>
      </View>
    </Pressable>
  );
}
