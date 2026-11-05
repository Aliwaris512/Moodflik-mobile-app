import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { login, signUp } from '@/api/auth';
import { apiMessage, fieldErrors } from '@/api/auth/errors';
import { pendingLogin } from '@/api/auth/pending';
import { signUpSchema } from '@/api/auth/schemas';
import { FormMessage, Heading } from '@/components/auth/auth-fields';
import { useAuthForm } from '@/components/auth/auth-form';
import { Button, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://www.moodflik.com';

export default function SignUp() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [error, setError] = useState('');

  const form = useAuthForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      username: '',
      email: '',
      password: '',
      confirm_password: '',
      date_of_birth: '',
      gender: '' as 'M' | 'F' | 'NA',
      terms: false as boolean,
    },
    validators: { onChange: signUpSchema },
    onSubmit: async ({ value }) => {
      setError('');
      try {
        await signUp({
          first_name: value.first_name,
          last_name: value.last_name,
          username: value.username,
          email: value.email,
          password: value.password,
          date_of_birth: value.date_of_birth,
          gender: value.gender,
          terms_confirmed: 1,
        });
        const result = await login({ email: value.email, password: value.password });
        if (result.deactivated) {
          pendingLogin.set({ token: result.accessToken, uuid: result.uuid });
          router.replace('/reactivate');
        } else {
          await signIn(result.accessToken, result.refreshToken);
        }
      } catch (e) {
        const fields = fieldErrors(e);
        if (fields.username) setError('A user with this username already exists.');
        else if (fields.date_of_birth) setError('You must be aged 13 or over to sign up!');
        else if (/already exist/i.test(apiMessage(e, ''))) setError('This email already exists.');
        else setError(apiMessage(e, 'Could not sign up. Please try again.'));
      }
    },
  });

  return (
    <Screen>
      <Heading>Sign Up</Heading>
      <FormMessage message={error} />
      <form.AppField name="first_name">
        {(field) => <field.TextField label="First Name" autoCapitalize="words" />}
      </form.AppField>
      <form.AppField name="last_name">
        {(field) => <field.TextField label="Last Name" autoCapitalize="words" />}
      </form.AppField>
      <form.AppField name="username">
        {(field) => <field.TextField label="Username" autoCapitalize="none" autoCorrect={false} />}
      </form.AppField>
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
      <form.AppField name="password">
        {(field) => <field.PasswordField label="Password" />}
      </form.AppField>
      <form.AppField name="confirm_password">
        {(field) => <field.PasswordField label="Confirm Password" />}
      </form.AppField>
      <form.AppField name="date_of_birth">
        {(field) => <field.DateField label="Date of Birth" />}
      </form.AppField>
      <form.AppField name="gender">{(field) => <field.GenderField />}</form.AppField>
      <form.AppField name="terms">
        {(field) => (
          <field.CheckboxField>
            <Text className="text-base text-ink">
              I agree to the{' '}
              <Text
                className="font-semibold text-brand underline"
                onPress={() => void WebBrowser.openBrowserAsync(`${WEB_URL}/terms-conditions`)}
              >
                Terms and conditions
              </Text>
            </Text>
          </field.CheckboxField>
        )}
      </form.AppField>
      <View className="mt-2">
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button
              title="Sign Up"
              loading={isSubmitting}
              onPress={() => void form.handleSubmit()}
            />
          )}
        </form.Subscribe>
      </View>
    </Screen>
  );
}
