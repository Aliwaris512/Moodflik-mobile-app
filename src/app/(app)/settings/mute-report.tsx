import { Text, View } from 'react-native';

import { useMutedUsers, useMuteUser } from '@/api/users';
import { SectionTitle, SmallButton, UserRow } from '@/components/profile/ui';
import { UserPicker } from '@/components/profile/user-picker';

export default function MuteAndReport() {
  const muted = useMutedUsers();
  const mute = useMuteUser();
  const mutedIds = new Set(muted.data?.muted_users.map((u) => u.uuid));

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <UserPicker
        renderAction={(u) =>
          mutedIds.has(u.uuid) ? (
            <SmallButton
              tone="neutral"
              title="Unmute"
              onPress={() => mute.mutate({ user_id: u.uuid, action: 'unmute' })}
            />
          ) : (
            <SmallButton
              title="Mute"
              onPress={() => mute.mutate({ user_id: u.uuid, action: 'mute' })}
            />
          )
        }
        header={
          <View className="px-4">
            <Text className="pt-4 text-sm leading-5 text-muted dark:text-neutral-300">
              Muted people stay quiet in your feed without knowing. To report a post or comment, tap
              its three dots (...) and choose Report.
            </Text>
            <SectionTitle>Muted users ({muted.data?.count ?? 0})</SectionTitle>
            {muted.data?.muted_users.length ? (
              muted.data.muted_users.map((u) => (
                <UserRow
                  key={u.uuid}
                  user={u}
                  action={
                    <SmallButton
                      tone="neutral"
                      title="Unmute"
                      onPress={() => mute.mutate({ user_id: u.uuid, action: 'unmute' })}
                    />
                  }
                />
              ))
            ) : (
              <Text className="py-2 text-sm text-muted">Nobody is muted.</Text>
            )}
            <SectionTitle>Mute someone</SectionTitle>
          </View>
        }
      />
    </View>
  );
}
