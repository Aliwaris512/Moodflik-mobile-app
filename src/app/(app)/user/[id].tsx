import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import {
  errorMessage,
  useBlockUser,
  useFollowLists,
  useMeId,
  useMutedUsers,
  useMuteUser,
  useSendFollowRequest,
  useUser,
} from '@/api/users';
import { ConfirmModal } from '@/components/profile/confirm-modal';
import { ProfileHeader } from '@/components/profile/profile-header';
import { Notice, SmallButton } from '@/components/profile/ui';
import { Loader } from '@/components/ui';

export default function UserProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const meId = useMeId();
  const { data: user, isPending, error } = useUser(id);
  const lists = useFollowLists(id);
  const myLists = useFollowLists();
  const muted = useMutedUsers();
  const follow = useSendFollowRequest();
  const block = useBlockUser();
  const mute = useMuteUser();
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  if (meId && id === meId) return <Redirect href="/profile" />;
  if (isPending) return <Loader />;
  if (error || !user) return <Notice>{errorMessage(error, 'User not found.')}</Notice>;

  const isMuted = muted.data?.muted_users.some((u) => u.uuid === user.uuid) ?? false;
  const isFollowing = myLists.data?.following.some((u) => u.uuid === user.uuid) ?? false;

  return (
    <ScrollView className="flex-1 bg-white dark:bg-neutral-950" contentContainerClassName="pb-10">
      <ProfileHeader
        user={user}
        followers={lists.data?.followers.length}
        following={lists.data?.following.length}
        actions={
          <>
            <SmallButton
              title={isFollowing ? 'Following' : 'Follow'}
              disabled={isFollowing || follow.isPending}
              onPress={() =>
                follow.mutate(user.uuid, {
                  onSuccess: (r) => setNote(r.message ?? r.response ?? 'Request sent'),
                  onError: (e) => setNote(errorMessage(e)),
                })
              }
            />
            <SmallButton
              tone="neutral"
              title={isMuted ? 'Unmute' : 'Mute'}
              onPress={() =>
                mute.mutate(
                  { user_id: user.uuid, action: isMuted ? 'unmute' : 'mute' },
                  { onSuccess: (r) => setNote(r.message) },
                )
              }
            />
            <SmallButton tone="danger" title="Block" onPress={() => setConfirmBlock(true)} />
          </>
        }
      />
      {note ? <Notice kind="info">{note}</Notice> : null}

      <ConfirmModal
        visible={confirmBlock}
        destructive
        title={`Block @${user.username}?`}
        message="They will no longer be able to see your posts or interact with you."
        confirmLabel="Block"
        loading={block.isPending}
        onCancel={() => setConfirmBlock(false)}
        onConfirm={() =>
          block.mutate(user.uuid, {
            onSuccess: () => {
              setConfirmBlock(false);
              router.back();
            },
            onError: (e) => {
              setConfirmBlock(false);
              setNote(errorMessage(e));
            },
          })
        }
      />
    </ScrollView>
  );
}
