import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';

import { useFollowLists, useMe } from '@/api/users';
import { ProfileHeader } from '@/components/profile/profile-header';
import { SmallButton } from '@/components/profile/ui';
import { Loader } from '@/components/ui';

export default function MyProfile() {
  const router = useRouter();
  const { data: user, isPending, refetch } = useMe();
  const lists = useFollowLists();

  if (isPending || !user) return <Loader />;

  return (
    <ScrollView className="flex-1 bg-white dark:bg-neutral-950" contentContainerClassName="pb-10">
      <ProfileHeader
        user={user}
        linkStats
        followers={lists.data?.followers.length}
        following={lists.data?.following.length}
        actions={
          <>
            <SmallButton title="Edit profile" onPress={() => router.push('/profile/edit')} />
            <SmallButton tone="neutral" title="Settings" onPress={() => router.push('/settings')} />
            <SmallButton tone="neutral" title="Refresh" onPress={() => void refetch()} />
          </>
        }
      />
    </ScrollView>
  );
}
