import { FlatList, Text, View } from 'react-native';

import { useDmRequests, useHandleDmRequest } from '@/api/chat';
import { Avatar } from '@/components/chat/avatar';
import { Button, Loader } from '@/components/ui';

export default function DmRequests() {
  const { data, isLoading } = useDmRequests();
  const handle = useHandleDmRequest();

  if (isLoading) return <Loader />;

  return (
    <View className="flex-1 bg-white">
      {data && data.length > 1 ? (
        <View className="flex-row gap-3 p-4">
          <View className="flex-1">
            <Button
              title="Accept all"
              onPress={() => handle.mutate({ action: 'accept_all' })}
              loading={handle.isPending}
            />
          </View>
          <View className="flex-1">
            <Button
              title="Reject all"
              variant="outline"
              onPress={() => handle.mutate({ action: 'reject_all' })}
              disabled={handle.isPending}
            />
          </View>
        </View>
      ) : null}
      <FlatList
        data={data ?? []}
        keyExtractor={(r) => String(r.id)}
        renderItem={({ item }) => (
          <View className="gap-3 border-b border-border p-4">
            <View className="flex-row items-center gap-3">
              <Avatar size={40} />
              <View className="flex-1">
                <Text className="font-semibold text-ink">{item.name}</Text>
                <Text className="text-sm text-muted" numberOfLines={2}>
                  {item.message}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button
                  title="Accept"
                  onPress={() =>
                    handle.mutate({ action: 'accept_request', room_id: item.room_id ?? undefined })
                  }
                  disabled={handle.isPending}
                />
              </View>
              <View className="flex-1">
                <Button
                  title="Reject"
                  variant="outline"
                  onPress={() =>
                    handle.mutate({ action: 'reject_request', room_id: item.room_id ?? undefined })
                  }
                  disabled={handle.isPending}
                />
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text className="mt-16 text-center text-muted">No requests.</Text>}
      />
    </View>
  );
}
