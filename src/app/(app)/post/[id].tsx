import { useLocalSearchParams } from 'expo-router';
import { FlatList, Text, View } from 'react-native';

import { useComments, useCreateComment, usePostDetail } from '@/api/posts';
import { detailToPost } from '@/api/posts/shape';
import { CommentItem } from '@/components/post/comment-item';
import { MessageForm } from '@/components/post/message-form';
import { PostCard } from '@/components/post/post-card';
import { Loader } from '@/components/ui';
import { useCommentRows } from '@/db/posts';

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = usePostDetail(id);
  const comments = useComments(id);
  const rows = useCommentRows(id);
  const create = useCreateComment(id);

  if (detail.isLoading) return <Loader />;
  if (!detail.data) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-muted">This post is unavailable.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <FlatList
        data={rows}
        keyExtractor={(c) => c.uuid}
        ListHeaderComponent={<PostCard post={detailToPost(detail.data)} linkToDetail={false} />}
        ListEmptyComponent={
          comments.isLoading ? undefined : (
            <Text className="p-6 text-center text-muted">No comments yet.</Text>
          )
        }
        renderItem={({ item }) => (
          <CommentItem
            photoUrl={item.photo_url}
            firstName={item.first_name}
            lastName={item.last_name}
            username={item.username}
            createdAt={item.created_at}
            body={item.comment}
          />
        )}
      />
      <MessageForm
        label="Add a comment"
        submitLabel="Comment"
        onSubmit={(text) => create.mutateAsync(text)}
      />
    </View>
  );
}
