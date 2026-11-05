import { useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';

import { useDebounced, useUserSearch } from '@/api/users';
import { EmptyState, UserRow } from '@/components/profile/ui';
import { Loader } from '@/components/ui';

export default function FindPeople() {
  const [q, setQ] = useState('');
  const term = useDebounced(q);
  const { data, isFetching } = useUserSearch(term);

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search by name or username"
        autoCapitalize="none"
        autoCorrect={false}
        className="m-4 rounded-xl border border-border px-4 py-3 text-base text-ink dark:text-white"
      />
      {isFetching && !data ? <Loader /> : null}
      <FlatList
        keyboardShouldPersistTaps="handled"
        data={term ? (data ?? []) : []}
        keyExtractor={(u) => u.uuid}
        renderItem={({ item }) => (
          <UserRow user={item} href={{ pathname: '/user/[id]', params: { id: item.uuid } }} />
        )}
        ListEmptyComponent={
          term && !isFetching ? (
            <EmptyState title="No one found" body="Try a different name or username." />
          ) : (
            <Text className="p-6 text-center text-muted">Search for people you know.</Text>
          )
        }
      />
    </View>
  );
}
