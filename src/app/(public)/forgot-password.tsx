import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useRequestPasswordReset } from '@/api/auth';
import { apiMessage } from '@/api/auth/errors';
import { forgotPasswordSchema } from '@/api/auth/schemas';
import { FormMessage, Heading } from '@/components/auth/auth-fields';
import { useAuthForm } from '@/components/auth/auth-form';
import { Button, Screen } from '@/components/ui';

export default function ForgotPassword() {
  const router = useRouter();
  const mutation = useRequestPasswordReset();
  const [error, setError] = useState('');

  const form = useAuthForm({
    defaultValues: { email: '' },
    validators: { onChange: forgotPasswordSchema },
    onSubmit: async ({ value }) => {
      setError('');
      try {
        await mutation.mutateAsync(value.email);
        router.push({ pathname: '/otp', params: { email: value.email } });
      } catch (e) {
        setError(apiMessage(e));
      }
    },
  });

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Heading>Enter Your Email</Heading>
        <FormMessage message={error} />
        <form.AppField name="email">
          {(field) => (
            <field.TextField
              label="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        </form.AppField>
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button
              title="Send reset code"
              loading={isSubmitting}
              onPress={() => void form.handleSubmit()}
            />
          )}
        </form.Subscribe>
      </View>
    </Screen>
  );
}
