import { ActivityIndicator, Pressable, type PressableProps, Text } from 'react-native';

type Props = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
};

const styles = {
  primary: 'bg-brand',
  outline: 'border border-brand bg-transparent',
  ghost: 'bg-transparent',
} as const;
const text = { primary: 'text-white', outline: 'text-brand', ghost: 'text-brand' } as const;

export function Button({ title, loading, variant = 'primary', disabled, ...rest }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      className={`items-center justify-center rounded-xl px-4 py-3 ${styles[variant]} ${disabled || loading ? 'opacity-60' : ''}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#00234b'} />
      ) : (
        <Text className={`text-base font-semibold ${text[variant]}`}>{title}</Text>
      )}
    </Pressable>
  );
}
