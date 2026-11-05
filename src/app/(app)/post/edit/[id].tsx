import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { usePostDetail, useUpdatePost } from '@/api/posts';
import { PostForm } from '@/components/post/post-form';
import { Loader, Screen } from '@/components/ui';

export default function EditPost() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const detail = usePostDetail(id);
  const update = useUpdatePost(id);

  if (detail.isLoading || !detail.data) return <Loader />;
  const post = detail.data as typeof detail.data & { mood_type?: string };

  return (
    <Screen>
      <PostForm
        submitLabel="Save changes"
        initial={{
          mood_type: post.mood_type,
          content: post.content,
          why_content: post.why_content,
          media_url: post.media_url,
          content_type: post.content_type,
        }}
        onSubmit={async (v) => {
          try {
            await update.mutateAsync({
              content: v.content,
              why_content: v.why_content || null,
              mood_type: v.mood_type,
              media_url: v.media_url,
              content_type: v.content_type,
            });
            router.back();
          } catch (error) {
            Alert.alert('Could not save', error instanceof Error ? error.message : 'Try again');
          }
        }}
      />
    </Screen>
  );
}
