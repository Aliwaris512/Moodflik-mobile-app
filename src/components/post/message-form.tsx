import { View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui';
import { useAppForm } from '@/lib/form';

type Props = {
  label: string;
  placeholder?: string;
  submitLabel: string;
  maxLength?: number;
  onSubmit: (text: string) => Promise<unknown>;
};

/** Single-field TanStack Form used for comments, ask-why threads and thread replies. */
export function MessageForm({
  label,
  placeholder,
  submitLabel,
  maxLength = 2000,
  onSubmit,
}: Props) {
  const schema = z.object({
    text: z.string().trim().min(1, 'Required').max(maxLength, `Max ${maxLength} characters`),
  });
  const form = useAppForm({
    defaultValues: { text: '' },
    validators: { onSubmit: schema },
    onSubmit: async ({ value, formApi }) => {
      await onSubmit(value.text.trim());
      formApi.reset();
    },
  });

  return (
    <View className="border-t border-border bg-white p-4 dark:bg-neutral-950">
      <form.AppField name="text">
        {(field) => <field.TextField label={label} placeholder={placeholder} multiline />}
      </form.AppField>
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(submitting) => (
          <Button
            title={submitLabel}
            loading={submitting}
            onPress={() => void form.handleSubmit()}
          />
        )}
      </form.Subscribe>
    </View>
  );
}
