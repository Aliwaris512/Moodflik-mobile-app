import { useLocalSearchParams } from 'expo-router';
import { FlatList, Text, View } from 'react-native';

import { useComments, useCreateComment } from '@/api/posts';
import { CommentItem } from '@/components/post/comment-item';
import { MessageForm } from '@/components/post/message-form';
import { Loader } from '@/components/ui';
import { useCommentRows } from '@/db/posts';

export default function CommentsScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const query = useComments(postId);
  const rows = useCommentRows(postId);
  const create = useCreateComment(postId);

  if (query.isLoading) return <Loader />;
  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <FlatList
        data={rows}
        keyExtractor={(c) => c.uuid}
        ListEmptyComponent={<Text className="p-6 text-center text-muted">No comments yet.</Text>}
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
