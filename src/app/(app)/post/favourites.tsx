import { useState } from 'react';
import { View } from 'react-native';

import { useFavourites } from '@/api/posts';
import type { PostKind } from '@/api/posts/types';
import { PostList } from '@/components/post/post-list';
import { SectionToggle } from '@/components/post/section-toggle';

export default function Favourites() {
  const [kind, setKind] = useState<PostKind>('like');
  const query = useFavourites(kind);
  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <PostList
        query={query}
        empty="No favourites yet."
        header={<SectionToggle value={kind} onChange={setKind} />}
      />
    </View>
  );
}
