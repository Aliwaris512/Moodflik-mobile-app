import { useRouter } from 'expo-router';
import { Text } from 'react-native';

import { useMe } from '@/api/users';
import { ProfileForm } from '@/components/profile/profile-form';
import { Loader, Screen } from '@/components/ui';

export default function ProfileSetup() {
  const router = useRouter();
  const { data: user } = useMe();
  if (!user) return <Loader />;
  return (
    <Screen>
      <Text className="mb-1 text-2xl font-bold text-ink dark:text-white">Set up your profile</Text>
      <Text className="mb-5 text-sm text-muted dark:text-neutral-400">
        Tell people who you are. You can change this any time.
      </Text>
      <ProfileForm user={user} submitLabel="Continue" onSaved={() => router.replace('/home')} />
    </Screen>
  );
}
