import { useState } from 'react';
import { Linking, Text } from 'react-native';

import { zContactUsBody } from '@/api/generated/zod.gen';
import { displayName, errorMessage, useContactUs, useMe } from '@/api/users';
import { Notice } from '@/components/profile/ui';
import { Button, Loader, Screen } from '@/components/ui';
import { useAppForm } from '@/lib/form';

export default function ContactScreen() {
  const { data: me, isPending } = useMe();
  if (isPending) return <Loader />;
  return <ContactForm name={displayName(me)} email={me?.email ?? ''} />;
}

function ContactForm({ name, email }: { name: string; email: string }) {
  const contact = useContactUs();
  const [note, setNote] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const form = useAppForm({
    defaultValues: { name, email, message: '' },
    validators: { onSubmit: zContactUsBody },
    onSubmit: async ({ value, formApi }) => {
      setNote(null);
      try {
        const res = await contact.mutateAsync(value);
        formApi.setFieldValue('message', '');
        setNote({ kind: 'ok', text: res.message || 'Query sent successfully' });
      } catch (e) {
        setNote({ kind: 'error', text: errorMessage(e) });
      }
    },
  });

  return (
    <Screen>
      <Text className="mb-4 text-sm leading-5 text-muted dark:text-neutral-300">
        Questions, feedback or a bug to report? Send us a message and we will get back to you.
      </Text>
      {note ? <Notice kind={note.kind}>{note.text}</Notice> : null}

      <form.AppField name="name">{(f) => <f.TextField label="Name" />}</form.AppField>
      <form.AppField name="email">
        {(f) => <f.TextField label="Email" keyboardType="email-address" autoCapitalize="none" />}
      </form.AppField>
      <form.AppField name="message">
        {(f) => (
          <f.TextField
            label="Message"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            style={{ minHeight: 120 }}
          />
        )}
      </form.AppField>

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(submitting) => (
          <Button
            title="Send message"
            loading={submitting}
            onPress={() => void form.handleSubmit()}
          />
        )}
      </form.Subscribe>
      <Button
        variant="ghost"
        title="Email info@moodflik.com"
        onPress={() => void Linking.openURL('mailto:info@moodflik.com')}
      />
    </Screen>
  );
}
