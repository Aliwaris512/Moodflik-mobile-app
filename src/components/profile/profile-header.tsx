import { Image } from 'expo-image';
import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { displayName, handle, type User } from '@/api/users';
import { Avatar } from '@/components/profile/ui';

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value?: number;
  href?: '/profile/followers' | '/profile/following';
}) {
  const body = (
    <View className="items-center px-4 py-2">
      <Text className="text-lg font-bold text-ink dark:text-white">{value ?? '\u2013'}</Text>
      <Text className="text-xs text-muted dark:text-neutral-400">{label}</Text>
    </View>
  );
  if (!href) return body;
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="link">{body}</Pressable>
    </Link>
  );
}

function BioLine({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View className="flex-row gap-2 py-1">
      <Text className="w-24 text-sm font-semibold text-brand-2 dark:text-neutral-300">{label}</Text>
      <Text className="flex-1 text-sm text-ink dark:text-white">{value}</Text>
    </View>
  );
}

export function ProfileHeader({
  user,
  followers,
  following,
  linkStats,
  actions,
}: {
  user: User;
  followers?: number;
  following?: number;
  linkStats?: boolean;
  actions?: ReactNode;
}) {
  return (
    <View>
      <View className="mb-12 h-36 bg-surface dark:bg-neutral-800">
        {user.cover_photo_url ? (
          <Image source={{ uri: user.cover_photo_url }} style={{ flex: 1 }} contentFit="cover" />
        ) : null}
        <View className="absolute -bottom-10 left-4 rounded-full border-4 border-white dark:border-neutral-950">
          <Avatar user={user} size={80} />
        </View>
      </View>

      <View className="px-4">
        <Text className="text-xl font-bold text-ink dark:text-white">{displayName(user)}</Text>
        <Text className="mb-2 text-sm text-muted dark:text-neutral-400">{handle(user)}</Text>

        <View className="mb-2 flex-row">
          <Stat
            label="Followers"
            value={followers}
            href={linkStats ? '/profile/followers' : undefined}
          />
          <Stat
            label="Following"
            value={following}
            href={linkStats ? '/profile/following' : undefined}
          />
        </View>

        <BioLine label="Me in 3 words" value={user.me} />
        <BioLine label="I like" value={user.like} />
        <BioLine label="I dislike" value={user.dislike} />
        <BioLine label="Location" value={[user.city, user.country].filter(Boolean).join(', ')} />
        <BioLine label="Website" value={user.website} />

        {actions ? <View className="mt-4 flex-row flex-wrap gap-3">{actions}</View> : null}
      </View>
    </View>
  );
}
