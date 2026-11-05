import { useState } from 'react';
import { Share, Text } from 'react-native';

import { zInviteBody } from '@/api/generated/zod.gen';
import { errorMessage, useInviteUser } from '@/api/users';
import { Notice } from '@/components/profile/ui';
import { Button, Screen } from '@/components/ui';
import { useAppForm } from '@/lib/form';

const APP_LINK = 'https://www.moodflik.com/';

export default function InviteScreen() {
  const invite = useInviteUser();
  const [note, setNote] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const form = useAppForm({
    defaultValues: { email: '' },
    validators: { onSubmit: zInviteBody },
    onSubmit: async ({ value, formApi }) => {
      setNote(null);
      try {
        const res = await invite.mutateAsync(value);
        formApi.reset();
        setNote({ kind: 'ok', text: res.message || 'Invitation sent' });
      } catch (e) {
        setNote({ kind: 'error', text: errorMessage(e) });
      }
    },
  });

  return (
    <Screen>
      <Text className="mb-4 text-sm leading-5 text-muted dark:text-neutral-300">
        Moodflik is better with friends. Send an email invitation or share the link directly.
      </Text>
      {note ? <Notice kind={note.kind}>{note.text}</Notice> : null}

      <form.AppField name="email">
        {(f) => (
          <f.TextField
            label="Friend's email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}
      </form.AppField>
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(submitting) => (
          <Button
            title="Send invitation"
            loading={submitting}
            onPress={() => void form.handleSubmit()}
          />
        )}
      </form.Subscribe>
      <Button
        variant="outline"
        title="Share link instead"
        onPress={() => void Share.share({ message: `Join me on Moodflik! ${APP_LINK}` })}
      />
    </Screen>
  );
}
