import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';

import { useCreateThread, useThreads } from '@/api/posts';
import { MessageForm } from '@/components/post/message-form';
import { Loader } from '@/components/ui';

export default function ThreadsScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();
  const threads = useThreads(postId);
  const create = useCreateThread(postId);

  if (threads.isLoading) return <Loader />;
  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <FlatList
        data={threads.data ?? []}
        keyExtractor={(t) => t.uuid}
        ListEmptyComponent={
          <Text className="p-6 text-center text-muted">No questions yet. Ask why below.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            className="border-b border-border px-4 py-4"
            onPress={() => router.push(`/thread/chat/${item.uuid}`)}
          >
            <Text className="text-base font-medium text-ink dark:text-white">{item.name}</Text>
          </Pressable>
        )}
      />
      <MessageForm
        label="Ask why"
        placeholder="Start a new thread"
        submitLabel="Create thread"
        maxLength={50}
        onSubmit={async (name) => {
          const created = await create.mutateAsync(name);
          if (created) router.push(`/thread/chat/${created.uuid}`);
        }}
      />
    </View>
  );
}
