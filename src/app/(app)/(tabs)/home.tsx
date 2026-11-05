import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useFeed } from '@/api/posts';
import type { PostKind } from '@/api/posts/types';
import { PostList } from '@/components/post/post-list';
import { SectionToggle } from '@/components/post/section-toggle';

export default function Home() {
  const router = useRouter();
  const [kind, setKind] = useState<PostKind>('like');
  const feed = useFeed(kind);

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <PostList
        query={feed}
        empty={kind === 'like' ? 'No likes posted yet.' : 'No dislikes posted yet.'}
        header={
          <View>
            <SectionToggle value={kind} onChange={setKind} />
            <Pressable
              accessibilityRole="search"
              onPress={() => router.push('/search')}
              className="mx-4 mb-2 rounded-xl border border-border px-4 py-3"
            >
              <Text className="text-muted">Search posts or people</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}
