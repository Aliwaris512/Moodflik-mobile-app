import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { useActivateAccount } from '@/api/auth';
import { apiMessage } from '@/api/auth/errors';
import { Heading } from '@/components/auth/auth-fields';
import { Button, Loader, Screen } from '@/components/ui';

export default function ActivateAccount() {
  const { uuid, token } = useLocalSearchParams<{ uuid: string; token: string }>();
  const router = useRouter();
  const query = useActivateAccount(uuid, token);

  if (query.isPending) return <Loader />;

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Heading>{query.isError ? 'Activation failed' : 'Account activated'}</Heading>
        <Text className="mb-6 text-center text-base text-ink">
          {query.isError
            ? apiMessage(query.error, 'Invalid or expired activation link.')
            : 'Your account is active. You can now sign in.'}
        </Text>
        <Button title="Go to Login" onPress={() => router.replace('/login')} />
      </View>
    </Screen>
  );
}
