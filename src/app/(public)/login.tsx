import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { useLogin } from '@/api/auth';
import { apiMessage } from '@/api/auth/errors';
import { pendingLogin } from '@/api/auth/pending';
import { loginSchema } from '@/api/auth/schemas';
import { FormMessage, Heading } from '@/components/auth/auth-fields';
import { useAuthForm } from '@/components/auth/auth-form';
import { Button, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const mutation = useLogin();
  const [error, setError] = useState('');

  const form = useAuthForm({
    defaultValues: { email: '', password: '' },
    validators: { onChange: loginSchema },
    onSubmit: async ({ value }) => {
      setError('');
      try {
        const result = await mutation.mutateAsync(value);
        if (result.deactivated) {
          pendingLogin.set({ token: result.accessToken, uuid: result.uuid });
          router.push('/reactivate');
        } else {
          await signIn(result.accessToken, result.refreshToken);
        }
      } catch (e) {
        setError(apiMessage(e, 'Incorrect email or password'));
      }
    },
  });

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Image
          source={require('@/assets/images/logo.png')}
          resizeMode="contain"
          className="mb-6 h-14 w-48 self-center"
        />
        <Heading>Sign In</Heading>
        <FormMessage message={error} />
        <form.AppField name="email">
          {(field) => (
            <field.TextField
              label="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          )}
        </form.AppField>
        <form.AppField name="password">
          {(field) => <field.PasswordField label="Password" />}
        </form.AppField>
        <Link href="/forgot-password" asChild>
          <Pressable className="mb-5 self-center">
            <Text className="text-base text-ink underline">Forgot Password?</Text>
          </Pressable>
        </Link>
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button title="Login" loading={isSubmitting} onPress={() => void form.handleSubmit()} />
          )}
        </form.Subscribe>
        <View className="mt-3">
          <Link href="/signup" asChild>
            <Button title="Sign Up" variant="outline" />
          </Link>
        </View>
      </View>
    </Screen>
  );
}
