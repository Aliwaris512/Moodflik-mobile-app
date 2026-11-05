import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { useFieldContext } from '@/lib/form';

function FieldError() {
  const field = useFieldContext<unknown>();
  const error = field.state.meta.errors[0] as { message?: string } | string | undefined;
  if (!field.state.meta.isTouched || !error) return null;
  return (
    <Text className="mt-1 text-xs text-danger">
      {typeof error === 'string' ? error : error.message}
    </Text>
  );
}

export function TextField({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  const field = useFieldContext<string>();
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-ink">{label}</Text>
      <TextInput
        className="rounded-xl border border-border px-4 py-3 text-base text-ink"
        value={field.state.value}
        onBlur={field.handleBlur}
        onChangeText={field.handleChange}
        {...props}
      />
      <FieldError />
    </View>
  );
}

export function PasswordField({ label, placeholder }: { label: string; placeholder?: string }) {
  const field = useFieldContext<string>();
  const [hidden, setHidden] = useState(true);
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-ink">{label}</Text>
      <View className="flex-row items-center rounded-xl border border-border px-4">
        <TextInput
          className="flex-1 py-3 text-base text-ink"
          value={field.state.value}
          placeholder={placeholder}
          secureTextEntry={hidden}
          autoCapitalize="none"
          autoCorrect={false}
          onBlur={field.handleBlur}
          onChangeText={field.handleChange}
        />
        <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
          <Text className="text-sm font-semibold text-brand">{hidden ? 'Show' : 'Hide'}</Text>
        </Pressable>
      </View>
      <FieldError />
    </View>
  );
}

export function GenderField() {
  const field = useFieldContext<string>();
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-ink">Gender</Text>
      <View className="rounded-xl border border-border">
        <Picker
          selectedValue={field.state.value}
          onValueChange={(v) => field.handleChange(v)}
          onBlur={field.handleBlur}
          prompt="Gender"
        >
          <Picker.Item label="Select Gender" value="" />
          <Picker.Item label="Male" value="M" />
          <Picker.Item label="Female" value="F" />
          <Picker.Item label="Prefer not to say" value="NA" />
        </Picker>
      </View>
      <FieldError />
    </View>
  );
}

const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function DateField({ label }: { label: string }) {
  const field = useFieldContext<string>();
  const [open, setOpen] = useState(false);
  const [today] = useState(() => new Date());
  const value = field.state.value ? new Date(field.state.value) : new Date(2000, 0, 1);
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-ink">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        className="rounded-xl border border-border px-4 py-3"
      >
        <Text className={field.state.value ? 'text-base text-ink' : 'text-base text-muted'}>
          {field.state.value || 'Date of Birth'}
        </Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={value}
          mode="date"
          maximumDate={today}
          onChange={(_, selected) => {
            setOpen(false);
            field.handleBlur();
            if (selected) field.handleChange(toIso(selected));
          }}
        />
      ) : null}
      <FieldError />
    </View>
  );
}

export function CheckboxField({ children }: { children: React.ReactNode }) {
  const field = useFieldContext<boolean>();
  return (
    <View className="mb-4">
      <Pressable
        className="flex-row items-center"
        accessibilityRole="checkbox"
        accessibilityState={{ checked: field.state.value }}
        onPress={() => {
          field.handleChange(!field.state.value);
          field.handleBlur();
        }}
      >
        <View
          className={`mr-3 h-6 w-6 items-center justify-center rounded border ${field.state.value ? 'border-brand bg-brand' : 'border-border'}`}
        >
          {field.state.value ? <Text className="text-xs font-bold text-white">✓</Text> : null}
        </View>
        <View className="flex-1">{children}</View>
      </Pressable>
      <FieldError />
    </View>
  );
}

export function Heading({ children }: { children: string }) {
  return <Text className="mb-5 text-center text-2xl font-bold text-ink">{children}</Text>;
}

export function FormMessage({
  message,
  tone = 'error',
}: {
  message?: string;
  tone?: 'error' | 'ok';
}) {
  if (!message) return null;
  return (
    <Text
      className={`mb-3 text-center text-sm ${tone === 'error' ? 'text-danger' : 'text-green-700'}`}
    >
      {message}
    </Text>
  );
}
