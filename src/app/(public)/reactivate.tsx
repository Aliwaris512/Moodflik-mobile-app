import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { useReactivateAccount } from '@/api/auth';
import { apiMessage } from '@/api/auth/errors';
import { pendingLogin } from '@/api/auth/pending';
import { FormMessage, Heading } from '@/components/auth/auth-fields';
import { Button, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function ReactivateAccount() {
  const router = useRouter();
  const { signIn } = useAuth();
  const mutation = useReactivateAccount();
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const onReactivate = async () => {
    setError('');
    try {
      const token = await mutation.mutateAsync();
      setDone(true);
      pendingLogin.set(null);
      setTimeout(() => void signIn(token), 1000);
    } catch (e) {
      setError(apiMessage(e, 'No session found, please login again.'));
    }
  };

  const onCancel = () => {
    pendingLogin.set(null);
    router.replace('/login');
  };

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Heading>Reactivate your account</Heading>
        <Text className="mb-6 text-center text-base text-ink">
          Your account is currently deactivated. Reactivate it to continue using Moodflik.
        </Text>
        <FormMessage message={error} />
        <FormMessage message={done ? 'Account reactivated!' : ''} tone="ok" />
        <Button
          title="Reactivate"
          loading={mutation.isPending}
          onPress={() => void onReactivate()}
        />
        <View className="mt-3">
          <Button title="Back to login" variant="outline" onPress={onCancel} />
        </View>
      </View>
    </Screen>
  );
}
