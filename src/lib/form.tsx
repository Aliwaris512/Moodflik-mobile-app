import { createFormHook, createFormHookContexts } from '@tanstack/react-form';
import type { ComponentProps } from 'react';

import { Input } from '@/components/ui';

export const { fieldContext, formContext, useFieldContext } = createFormHookContexts();

type InputProps = Omit<ComponentProps<typeof Input>, 'value' | 'onChangeText' | 'error'> & {
  /** Rewrites the text as the user types (for example a date mask). */
  format?: (value: string) => string;
};

/** Validator errors can be plain strings or objects with a message (schema validators). */
function errorText(error: unknown): string | undefined {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const { message } = error;
    return typeof message === 'string' ? message : undefined;
  }
  return undefined;
}

function TextField({ format, ...props }: InputProps) {
  const field = useFieldContext<string>();
  const error = field.state.meta.isTouched ? errorText(field.state.meta.errors[0]) : undefined;
  return (
    <Input
      {...props}
      value={field.state.value}
      onBlur={field.handleBlur}
      onChangeText={(text) => field.handleChange(format ? format(text) : text)}
      error={error}
    />
  );
}

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField },
  formComponents: {},
});
