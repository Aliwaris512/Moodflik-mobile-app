import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { useCreatePost } from '@/api/posts';
import type { PostKind } from '@/api/posts/types';
import { PostForm } from '@/components/post/post-form';
import { SectionToggle } from '@/components/post/section-toggle';
import { Screen } from '@/components/ui';

export default function CreatePost() {
  const router = useRouter();
  const [kind, setKind] = useState<PostKind>('like');
  const create = useCreatePost();

  return (
    <Screen>
      <SectionToggle value={kind} onChange={setKind} />
      <PostForm
        key={kind}
        submitLabel={kind === 'like' ? 'Post like' : 'Post dislike'}
        onSubmit={async (v) => {
          try {
            await create.mutateAsync({
              post_type: kind,
              mood_type: v.mood_type,
              content: v.content,
              why_content: v.why_content || null,
              media_url: v.media_url,
              content_type: v.content_type,
            });
            router.navigate('/home');
          } catch (error) {
            Alert.alert('Could not post', error instanceof Error ? error.message : 'Try again');
          }
        }}
      />
    </Screen>
  );
}
