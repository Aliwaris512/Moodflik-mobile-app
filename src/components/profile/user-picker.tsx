import { useState } from 'react';
import type { ReactNode } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';

import { useDebounced, type User, useUserSearch } from '@/api/users';
import { EmptyState, UserRow } from '@/components/profile/ui';

/** Search box + results with a per-row action. Used by block and mute screens. */
export function UserPicker({
  hideBlocked,
  renderAction,
  header,
}: {
  hideBlocked?: boolean;
  renderAction: (user: User) => ReactNode;
  header?: ReactNode;
}) {
  const [q, setQ] = useState('');
  const term = useDebounced(q);
  const { data, isFetching } = useUserSearch(term, { hideBlocked });
  return (
    <FlatList
      keyboardShouldPersistTaps="handled"
      data={term ? (data ?? []) : []}
      keyExtractor={(u) => u.uuid}
      ListHeaderComponent={
        <View>
          {header}
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by name or username"
            autoCapitalize="none"
            autoCorrect={false}
            className="mx-4 mb-2 mt-3 rounded-xl border border-border px-4 py-3 text-base text-ink dark:text-white"
          />
        </View>
      }
      renderItem={({ item }) => <UserRow user={item} action={renderAction(item)} />}
      ListEmptyComponent={
        term && !isFetching ? (
          <EmptyState title="No one found" />
        ) : (
          <Text className="px-4 pt-2 text-center text-muted">
            {isFetching ? 'Searching\u2026' : ''}
          </Text>
        )
      }
    />
  );
}
