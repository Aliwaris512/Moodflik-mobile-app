import { useRouter } from 'expo-router';
import { Alert, FlatList, Text, View } from 'react-native';

import {
  useFollowLists,
  useReceivedRequests,
  useRemoveFollow,
  useRequestDecision,
  type UserLite,
  useSentRequests,
} from '@/api/users';
import { EmptyState, SectionTitle, SmallButton, UserRow } from '@/components/profile/ui';
import { Loader } from '@/components/ui';

/** Followers / following list, plus pending follow requests for each side. */
export function Connections({ kind }: { kind: 'followers' | 'following' }) {
  const router = useRouter();
  const lists = useFollowLists();
  const received = useReceivedRequests();
  const sent = useSentRequests();
  const remove = useRemoveFollow();
  const decide = useRequestDecision();

  if (lists.isPending) return <Loader />;

  const users: UserLite[] = lists.data?.[kind] ?? [];
  const requests = kind === 'followers' ? received.data : sent.data;

  const confirmRemove = (u: UserLite) =>
    Alert.alert(
      kind === 'following' ? 'Unfollow' : 'Remove follower',
      `Are you sure you want to ${kind === 'following' ? 'unfollow' : 'remove'} @${u.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => remove.mutate({ id: u.uuid, type: kind }),
        },
      ],
    );

  return (
    <FlatList
      data={users}
      keyExtractor={(u) => u.uuid}
      onRefresh={() => void lists.refetch()}
      refreshing={lists.isRefetching}
      ListHeaderComponent={
        requests && requests.length > 0 ? (
          <View className="px-4">
            <SectionTitle>
              {kind === 'followers' ? 'Follow requests' : 'Requests you sent'}
            </SectionTitle>
            {requests.map((r) => {
              const person = kind === 'followers' ? r.sender : r.receiver;
              return (
                <UserRow
                  key={r.uuid}
                  user={person}
                  action={
                    kind === 'followers' ? (
                      <View className="flex-row gap-2">
                        <SmallButton
                          title="Accept"
                          onPress={() => decide.mutate({ id: r.uuid, decision: 'approve' })}
                        />
                        <SmallButton
                          tone="neutral"
                          title="Decline"
                          onPress={() => decide.mutate({ id: r.uuid, decision: 'reject' })}
                        />
                      </View>
                    ) : (
                      <SmallButton
                        tone="neutral"
                        title="Cancel"
                        onPress={() => decide.mutate({ id: r.uuid, decision: 'cancel' })}
                      />
                    )
                  }
                />
              );
            })}
            <SectionTitle>{kind === 'followers' ? 'Followers' : 'Following'}</SectionTitle>
          </View>
        ) : undefined
      }
      ListEmptyComponent={
        <EmptyState
          title={kind === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
          body="Find people to connect with from search."
        />
      }
      renderItem={({ item }) => (
        <UserRow
          user={item}
          href={{ pathname: '/user/[id]', params: { id: item.uuid } }}
          action={
            <SmallButton
              tone="neutral"
              title={kind === 'following' ? 'Unfollow' : 'Remove'}
              onPress={() => confirmRemove(item)}
            />
          }
        />
      )}
      ListFooterComponent={
        <Text
          onPress={() => router.push('/user/search')}
          className="p-4 text-center font-semibold text-brand"
        >
          Find people
        </Text>
      }
    />
  );
}
