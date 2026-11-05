import { createFormHook, createFormHookContexts } from '@tanstack/react-form';
import { Text, TextInput, type TextInputProps, View } from 'react-native';

export const { fieldContext, formContext, useFieldContext } = createFormHookContexts();

function TextField({ label, ...props }: { label: string } & TextInputProps) {
  const field = useFieldContext<string>();
  const error = field.state.meta.errors[0] as { message?: string } | string | undefined;
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-neutral-700">{label}</Text>
      <TextInput
        className="rounded-xl border border-neutral-300 px-4 py-3 text-base"
        value={field.state.value}
        onBlur={field.handleBlur}
        onChangeText={field.handleChange}
        {...props}
      />
      {field.state.meta.isTouched && error ? (
        <Text className="mt-1 text-xs text-red-600">
          {typeof error === 'string' ? error : error.message}
        </Text>
      ) : null}
    </View>
  );
}

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField },
  formComponents: {},
});
