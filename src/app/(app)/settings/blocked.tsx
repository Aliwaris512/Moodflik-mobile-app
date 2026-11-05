import { useState } from 'react';
import { Text, View } from 'react-native';

import {
  errorMessage,
  handle,
  useBlockedUsers,
  useBlockUser,
  type User,
  useUnblockUser,
} from '@/api/users';
import { ConfirmModal } from '@/components/profile/confirm-modal';
import { Notice, SectionTitle, SmallButton, UserRow } from '@/components/profile/ui';
import { UserPicker } from '@/components/profile/user-picker';

export default function BlockedUsers() {
  const blocked = useBlockedUsers();
  const block = useBlockUser();
  const unblock = useUnblockUser();
  const [target, setTarget] = useState<User | null>(null);
  const [note, setNote] = useState<string | null>(null);

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <UserPicker
        hideBlocked
        renderAction={(u) => (
          <SmallButton tone="danger" title="Block" onPress={() => setTarget(u)} />
        )}
        header={
          <View className="px-4">
            {note ? <Notice kind="info">{note}</Notice> : null}
            <SectionTitle>Blocked ({blocked.data?.length ?? 0})</SectionTitle>
            {blocked.data?.length ? (
              blocked.data.map((u) => (
                <UserRow
                  key={u.uuid}
                  user={u}
                  action={
                    <SmallButton
                      tone="neutral"
                      title="Unblock"
                      onPress={() => unblock.mutate(u.uuid)}
                    />
                  }
                />
              ))
            ) : (
              <Text className="py-2 text-sm text-muted">You have not blocked anyone.</Text>
            )}
            <SectionTitle>Block someone</SectionTitle>
          </View>
        }
      />
      <ConfirmModal
        visible={!!target}
        destructive
        title={`Block ${target ? handle(target) : ''}?`}
        message="They will no longer be able to see your posts or interact with you."
        confirmLabel="Block"
        loading={block.isPending}
        onCancel={() => setTarget(null)}
        onConfirm={() =>
          target &&
          block.mutate(target.uuid, {
            onSuccess: () => {
              setNote(`${handle(target)} has been blocked.`);
              setTarget(null);
            },
            onError: (e) => {
              setNote(errorMessage(e));
              setTarget(null);
            },
          })
        }
      />
    </View>
  );
}
