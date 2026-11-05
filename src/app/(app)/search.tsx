import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';

import { usePostSearch } from '@/api/posts/search';
import { useDebounced, useUserSearch } from '@/api/users';
import { PostCard } from '@/components/post/post-card';
import { EmptyState, UserRow } from '@/components/profile/ui';
import { Loader } from '@/components/ui';

type Tab = 'posts' | 'people';

export default function SearchScreen() {
  const [tab, setTab] = useState<Tab>('posts');
  const [text, setText] = useState('');
  const term = useDebounced(text);
  const posts = usePostSearch(tab === 'posts' ? term : '');
  const people = useUserSearch(tab === 'people' ? term : '', { hideBlocked: true });
  const hasTerm = term.trim().length > 0;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'posts', label: 'Posts' },
    { key: 'people', label: 'People' },
  ];

  const header = (
    <View className="px-4 pb-2 pt-3">
      <View className="flex-row items-center rounded-xl border border-border px-3">
        <Ionicons name="search" size={18} color="#504f55" />
        <TextInput
          autoFocus
          value={text}
          onChangeText={setText}
          placeholder="Search posts or people"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          className="flex-1 px-2 py-3 text-base text-ink dark:text-white"
        />
      </View>
      <View className="mt-3 flex-row gap-2">
        {tabs.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 ${tab === t.key ? 'bg-brand' : 'bg-surface'}`}
          >
            <Text className={tab === t.key ? 'font-semibold text-white' : 'text-ink'}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  if (tab === 'people') {
    return (
      <FlatList
        keyboardShouldPersistTaps="handled"
        data={hasTerm ? (people.data ?? []) : []}
        keyExtractor={(u) => u.uuid}
        ListHeaderComponent={header}
        renderItem={({ item }) => <UserRow user={item} href={`/user/${item.uuid}`} />}
        ListEmptyComponent={
          people.isFetching ? (
            <Loader />
          ) : (
            <EmptyState title={hasTerm ? 'No people found' : 'Search for people'} />
          )
        }
      />
    );
  }

  const rows = posts.data?.pages.flatMap((p) => p.results) ?? [];
  return (
    <FlatList
      keyboardShouldPersistTaps="handled"
      data={hasTerm ? rows : []}
      keyExtractor={(p) => p.uuid}
      ListHeaderComponent={header}
      renderItem={({ item }) => <PostCard post={item} />}
      ListEmptyComponent={
        posts.isFetching ? (
          <Loader />
        ) : (
          <View className="items-center p-10">
            <Text className="text-muted">
              {posts.isError
                ? 'Could not search posts.'
                : hasTerm
                  ? 'No posts found.'
                  : 'Search for posts by text or author.'}
            </Text>
          </View>
        )
      }
      onEndReached={() => {
        if (posts.hasNextPage && !posts.isFetchingNextPage) void posts.fetchNextPage();
      }}
      onEndReachedThreshold={0.6}
    />
  );
}
