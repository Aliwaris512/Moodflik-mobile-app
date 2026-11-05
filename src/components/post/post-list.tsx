import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import type { PaginatedPostShowList } from '@/api/generated/types.gen';
import { Loader } from '@/components/ui';

import { PostCard } from './post-card';

export function PostList({
  query,
  header,
  empty = 'Nothing here yet.',
  filter,
}: {
  query: UseInfiniteQueryResult<InfiniteData<PaginatedPostShowList, number>, Error>;
  header?: ReactElement;
  empty?: string;
  filter?: string;
}) {
  if (query.isLoading) return <Loader />;
  const needle = filter?.trim().toLowerCase();
  const posts = (query.data?.pages.flatMap((p) => p.results) ?? []).filter(
    (p) =>
      !needle ||
      `${p.content ?? ''} ${p.user} ${p.first_name} ${p.last_name} ${p.mood_type ?? ''}`
        .toLowerCase()
        .includes(needle),
  );
  return (
    <FlatList
      data={posts}
      keyExtractor={(p) => p.uuid}
      renderItem={({ item }) => <PostCard post={item} />}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <View className="items-center p-10">
          <Text className="text-muted">{query.isError ? 'Could not load posts.' : empty}</Text>
        </View>
      }
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching && !query.isFetchingNextPage}
          onRefresh={() => void query.refetch()}
        />
      }
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
      }}
      onEndReachedThreshold={0.6}
    />
  );
}
