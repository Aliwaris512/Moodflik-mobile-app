import { useLocalSearchParams } from 'expo-router';
import { FlatList, Text, View } from 'react-native';

import { useCreateThreadComment, useThreadComments } from '@/api/posts';
import { CommentItem } from '@/components/post/comment-item';
import { MessageForm } from '@/components/post/message-form';
import { Loader } from '@/components/ui';

export default function ThreadChat() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const query = useThreadComments(threadId);
  const create = useCreateThreadComment(threadId);

  if (query.isLoading) return <Loader />;
  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <FlatList
        data={query.data ?? []}
        keyExtractor={(c) => c.uuid}
        ListEmptyComponent={<Text className="p-6 text-center text-muted">No replies yet.</Text>}
        renderItem={({ item }) => (
          <CommentItem
            photoUrl={item.user.photo_url}
            firstName={item.user.first_name}
            lastName={item.user.last_name}
            username={item.user.username}
            createdAt={item.created_at}
            body={item.comment}
          />
        )}
      />
      <MessageForm label="Reply" submitLabel="Send" onSubmit={(text) => create.mutateAsync(text)} />
    </View>
  );
}
