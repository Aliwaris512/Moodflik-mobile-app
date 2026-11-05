import { router } from 'expo-router';
import { Pressable, RefreshControl, SectionList, Text, View } from 'react-native';

import {
  type FollowRequest,
  hrefForNotification,
  useFollowRequestAction,
  useNotifications,
  useReceivedFollowRequests,
  useSentFollowRequests,
} from '@/api/notifications';
import { Avatar } from '@/components/chat/avatar';
import { formatTime, fullName } from '@/components/chat/format';
import { Button, Loader } from '@/components/ui';
import { type NotificationRow, useNotificationRows } from '@/db/notifications';

type Item =
  | { kind: 'received'; request: FollowRequest }
  | { kind: 'sent'; request: FollowRequest }
  | { kind: 'notification'; row: NotificationRow };

export default function Notifications() {
  const query = useNotifications();
  const received = useReceivedFollowRequests();
  const sent = useSentFollowRequests();
  const act = useFollowRequestAction();
  const rows = useNotificationRows();

  if (query.isLoading && rows.length === 0) return <Loader />;

  const sections = [
    {
      title: 'Follow requests',
      data: (received.data ?? []).map((request): Item => ({ kind: 'received', request })),
    },
    {
      title: 'Requests you sent',
      data: (sent.data ?? []).map((request): Item => ({ kind: 'sent', request })),
    },
    { title: 'Activity', data: rows.map((row): Item => ({ kind: 'notification', row })) },
  ].filter((s) => s.data.length > 0);

  const refresh = () => {
    void query.refetch();
    void received.refetch();
    void sent.refetch();
  };

  const renderItem = ({ item }: { item: Item }) => {
    if (item.kind === 'notification') {
      const { row } = item;
      const href = hrefForNotification(row);
      return (
        <Pressable
          className={`flex-row items-center gap-3 border-b border-border px-4 py-3 ${
            row.seen ? '' : 'bg-surface'
          }`}
          onPress={() => href && router.push(href)}
        >
          <Avatar uri={row.sender_image} size={44} />
          <View className="flex-1">
            <Text className="text-ink">{row.message}</Text>
            <Text className="text-xs text-muted">{formatTime(row.datetime)}</Text>
          </View>
        </Pressable>
      );
    }
    const { request } = item;
    const person = item.kind === 'received' ? request.sender : request.receiver;
    return (
      <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
        <Avatar uri={person.photo_url} size={44} />
        <Text className="flex-1 font-semibold text-ink" numberOfLines={1}>
          {fullName(person)}
        </Text>
        {item.kind === 'received' ? (
          <>
            <Button
              title="Approve"
              disabled={act.isPending}
              onPress={() => act.mutate({ action: 'approve', requestId: request.uuid })}
            />
            <Button
              title="Reject"
              variant="outline"
              disabled={act.isPending}
              onPress={() => act.mutate({ action: 'reject', requestId: request.uuid })}
            />
          </>
        ) : (
          <Button
            title="Cancel"
            variant="outline"
            disabled={act.isPending}
            onPress={() => act.mutate({ action: 'cancel', requestId: request.uuid })}
          />
        )}
      </View>
    );
  };

  return (
    <SectionList
      className="flex-1 bg-white"
      sections={sections}
      keyExtractor={(item) =>
        item.kind === 'notification' ? item.row.uuid : `${item.kind}-${item.request.uuid}`
      }
      renderItem={renderItem}
      renderSectionHeader={({ section }) => (
        <Text className="bg-white px-4 pb-1 pt-4 text-sm font-bold uppercase text-brand-2">
          {section.title}
        </Text>
      )}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={refresh} />}
      ListEmptyComponent={<Text className="mt-16 text-center text-muted">Nothing new.</Text>}
    />
  );
}
