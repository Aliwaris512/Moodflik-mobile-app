import { Image } from 'expo-image';
import { type Href, Link } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { displayName, handle, type UserLite } from '@/api/users';

export function Avatar({
  user,
  uri,
  size = 44,
}: {
  user?: Pick<UserLite, 'first_name' | 'last_name' | 'username' | 'photo_url'> | null;
  uri?: string | null;
  size?: number;
}) {
  const src = uri ?? user?.photo_url;
  const initial = (displayName(user) || '?').charAt(0).toUpperCase();
  const style = { width: size, height: size, borderRadius: size / 2 };
  if (src) return <Image source={{ uri: src }} style={style} contentFit="cover" />;
  return (
    <View style={style} className="items-center justify-center bg-brand">
      <Text className="font-bold text-white" style={{ fontSize: size * 0.4 }}>
        {initial}
      </Text>
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-muted dark:text-neutral-400">
      {children}
    </Text>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {children}
    </View>
  );
}

type RowProps = {
  title: string;
  subtitle?: string;
  href?: Href;
  onPress?: () => void;
  destructive?: boolean;
  right?: ReactNode;
};

export function Row({ title, subtitle, href, onPress, destructive, right }: RowProps) {
  const body = (
    <View className="flex-row items-center gap-3 border-b border-border px-4 py-3.5 dark:border-neutral-800">
      <View className="flex-1">
        <Text
          className={`text-base font-medium ${destructive ? 'text-danger' : 'text-ink dark:text-white'}`}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 text-sm text-muted dark:text-neutral-400">{subtitle}</Text>
        ) : null}
      </View>
      {right ?? (href || onPress ? <Text className="text-lg text-muted">{'›'}</Text> : null)}
    </View>
  );
  if (href) {
    return (
      <Link href={href} asChild>
        <Pressable accessibilityRole="link">{body}</Pressable>
      </Link>
    );
  }
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress}>
        {body}
      </Pressable>
    );
  }
  return body;
}

export function ToggleRow({
  title,
  subtitle,
  value,
  onChange,
  disabled,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Row
      title={title}
      subtitle={subtitle}
      right={
        <Switch
          value={value}
          disabled={disabled}
          onValueChange={onChange}
          trackColor={{ true: '#1bdab5', false: '#c4c4c4' }}
        />
      }
    />
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T | undefined;
  onChange: (next: T) => void;
}) {
  return (
    <View className="flex-row gap-2 px-4 pb-3.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            className={`flex-1 items-center rounded-xl border px-2 py-2 ${active ? 'border-brand bg-brand' : 'border-border bg-transparent'}`}
          >
            <Text
              className={`text-xs font-semibold ${active ? 'text-white' : 'text-ink dark:text-white'}`}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function UserRow({
  user,
  href,
  action,
}: {
  user: UserLite;
  href?: Href;
  action?: ReactNode;
}) {
  const body = (
    <View className="flex-row items-center gap-3 border-b border-border px-4 py-3 dark:border-neutral-800">
      <Avatar user={user} />
      <View className="flex-1">
        <Text className="text-base font-semibold text-ink dark:text-white" numberOfLines={1}>
          {displayName(user)}
        </Text>
        <Text className="text-sm text-muted dark:text-neutral-400" numberOfLines={1}>
          {handle(user)}
        </Text>
      </View>
      {action}
    </View>
  );
  if (!href) return body;
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="link">{body}</Pressable>
    </Link>
  );
}

export function Notice({
  kind = 'error',
  children,
}: {
  kind?: 'error' | 'ok' | 'info';
  children: ReactNode;
}) {
  const tone =
    kind === 'error'
      ? 'bg-red-50 text-red-700'
      : kind === 'ok'
        ? 'bg-emerald-50 text-emerald-700'
        : 'bg-surface text-ink';
  return <Text className={`mb-3 rounded-xl px-3 py-2.5 text-sm ${tone}`}>{children}</Text>;
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <View className="items-center px-6 py-12">
      <Text className="text-lg font-semibold text-ink dark:text-white">{title}</Text>
      {body ? (
        <Text className="mt-1 text-center text-sm text-muted dark:text-neutral-400">{body}</Text>
      ) : null}
    </View>
  );
}

export function SmallButton({
  title,
  onPress,
  tone = 'primary',
  disabled,
}: {
  title: string;
  onPress: () => void;
  tone?: 'primary' | 'danger' | 'neutral';
  disabled?: boolean;
}) {
  const bg =
    tone === 'primary'
      ? 'bg-brand'
      : tone === 'danger'
        ? 'bg-danger'
        : 'bg-surface border border-border';
  const fg = tone === 'neutral' ? 'text-ink' : 'text-white';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={`rounded-full px-3.5 py-1.5 ${bg} ${disabled ? 'opacity-50' : ''}`}
    >
      <Text className={`text-xs font-semibold ${fg}`}>{title}</Text>
    </Pressable>
  );
}
