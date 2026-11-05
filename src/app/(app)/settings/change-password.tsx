import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { z } from 'zod';

import { errorMessage, useChangePassword } from '@/api/users';
import { Notice } from '@/components/profile/ui';
import { Button, Screen } from '@/components/ui';
import { useAppForm } from '@/lib/form';

const PASSWORD_RULE = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;

const schema = z
  .object({
    old_password: z.string().min(1, 'Enter your current password'),
    new_password1: z
      .string()
      .regex(
        PASSWORD_RULE,
        'Use 6\u201316 characters with letters, a number and a special character (!@#$%^&*)',
      ),
    new_password2: z.string(),
  })
  .refine((v) => v.new_password1 === v.new_password2, {
    path: ['new_password2'],
    message: 'Passwords do not match',
  });

export default function ChangePasswordScreen() {
  const router = useRouter();
  const change = useChangePassword();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const form = useAppForm({
    defaultValues: { old_password: '', new_password1: '', new_password2: '' },
    validators: { onSubmit: schema },
    onSubmit: async ({ value, formApi }) => {
      setError(null);
      try {
        await change.mutateAsync(value);
        formApi.reset();
        setDone(true);
      } catch (e) {
        setError(errorMessage(e));
      }
    },
  });

  return (
    <Screen>
      <Text className="mb-4 text-sm text-muted dark:text-neutral-400">
        Choose a strong password you do not use anywhere else.
      </Text>
      {error ? <Notice>{error}</Notice> : null}
      {done ? <Notice kind="ok">Password changed.</Notice> : null}

      <form.AppField name="old_password">
        {(f) => <f.TextField label="Current password" secureTextEntry autoCapitalize="none" />}
      </form.AppField>
      <form.AppField name="new_password1">
        {(f) => <f.TextField label="New password" secureTextEntry autoCapitalize="none" />}
      </form.AppField>
      <form.AppField name="new_password2">
        {(f) => <f.TextField label="Confirm new password" secureTextEntry autoCapitalize="none" />}
      </form.AppField>

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(submitting) => (
          <Button
            title="Update password"
            loading={submitting}
            onPress={() => void form.handleSubmit()}
          />
        )}
      </form.Subscribe>
      {done ? <Button variant="ghost" title="Done" onPress={() => router.back()} /> : null}
    </Screen>
  );
}
