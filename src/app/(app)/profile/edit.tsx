import { useRouter } from 'expo-router';

import { useMe } from '@/api/users';
import { ProfileForm } from '@/components/profile/profile-form';
import { Loader, Screen } from '@/components/ui';

export default function EditProfile() {
  const router = useRouter();
  const { data: user } = useMe();
  if (!user) return <Loader />;
  return (
    <Screen>
      <ProfileForm user={user} submitLabel="Save changes" onSaved={() => router.back()} />
    </Screen>
  );
}
