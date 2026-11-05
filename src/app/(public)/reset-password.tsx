import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { useResetPassword } from '@/api/auth';
import { apiMessage } from '@/api/auth/errors';
import { PASSWORD_HINT, resetPasswordSchema } from '@/api/auth/schemas';
import { FormMessage, Heading } from '@/components/auth/auth-fields';
import { useAuthForm } from '@/components/auth/auth-form';
import { Button, Screen } from '@/components/ui';

export default function ResetPassword() {
  const { email, code } = useLocalSearchParams<{ email: string; code: string }>();
  const router = useRouter();
  const mutation = useResetPassword();
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const form = useAuthForm({
    defaultValues: { password: '', confirm_password: '' },
    validators: { onChange: resetPasswordSchema },
    onSubmit: async ({ value }) => {
      setError('');
      try {
        await mutation.mutateAsync({ email, code: Number(code), password: value.password });
        setDone(true);
      } catch (e) {
        setError(apiMessage(e));
      }
    },
  });

  if (done) {
    return (
      <Screen>
        <View className="flex-1 justify-center">
          <Heading>Password Changed</Heading>
          <Text className="mb-6 text-center text-base text-ink">
            Now you can login with new password, Thank you
          </Text>
          <Button title="Go to Login" onPress={() => router.replace('/login')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Heading>Change your password</Heading>
        <FormMessage message={error} />
        <form.AppField name="password">
          {(field) => <field.PasswordField label="New Password" />}
        </form.AppField>
        <Text className="-mt-2 mb-4 text-xs text-muted">{PASSWORD_HINT}</Text>
        <form.AppField name="confirm_password">
          {(field) => <field.PasswordField label="Confirm Password" />}
        </form.AppField>
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button
              title="Change password"
              loading={isSubmitting}
              onPress={() => void form.handleSubmit()}
            />
          )}
        </form.Subscribe>
      </View>
    </Screen>
  );
}
