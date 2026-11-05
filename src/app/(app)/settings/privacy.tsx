import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';

import {
  type AccountPrivacySettings,
  type SettingsResponse,
  useAccountPrivacy,
  usePrivacySettings,
  useSaveAccountPrivacy,
  useSavePrivacySettings,
} from '@/api/users';
import { Card, Notice, SectionTitle, Segmented, ToggleRow } from '@/components/profile/ui';
import { Loader } from '@/components/ui';

type AudienceKey = 'privacy_settings' | 'bio_settings' | 'like_dislike_settings';

const AUDIENCE_OPTIONS: Record<AudienceKey, { label: string; value: string }[]> = {
  privacy_settings: [
    { label: 'Anyone', value: 'Anyone' },
    { label: 'Followers', value: 'OnlyFollowers' },
    { label: 'Following', value: 'OnlyFollowing' },
  ],
  bio_settings: [
    { label: 'Anyone', value: 'Show_Posts_to_anyone' },
    { label: 'Followers', value: 'Only_Followers' },
    { label: 'Following', value: 'Only_Following' },
  ],
  like_dislike_settings: [
    { label: 'Anyone', value: 'Show_Posts_to_anyone' },
    { label: 'Followers', value: 'Only_Followers' },
    { label: 'Following', value: 'Only_Following' },
  ],
};

const AUDIENCE_KEYS: AudienceKey[] = ['privacy_settings', 'bio_settings', 'like_dislike_settings'];

const AUDIENCE_TITLES: Record<AudienceKey, string> = {
  privacy_settings: 'Who can see my posts',
  bio_settings: 'Who can see my bio',
  like_dislike_settings: 'Who can see my likes & dislikes',
};

const ACCOUNT_TOGGLES: {
  key: keyof Omit<AccountPrivacySettings, 'follow_request_audience'>;
  title: string;
  subtitle?: string;
}[] = [
  { key: 'username_search_visible', title: 'Appear in username search' },
  { key: 'profile_photo_public', title: 'Profile photo is public' },
  {
    key: 'posts_public_by_default',
    title: 'Make my posts public by default',
    subtitle: 'Turn off so only approved followers see your moods',
  },
  { key: 'allow_comments', title: 'Allow comments on my posts' },
  { key: 'show_online_status', title: 'Show when I am online' },
  { key: 'show_mood_history', title: 'Show my mood history' },
  { key: 'email_activity_updates', title: 'Email me activity updates' },
  { key: 'two_factor_enabled', title: 'Two-factor authentication' },
];

const toIndex = (key: AudienceKey, value: string) =>
  Math.max(
    0,
    AUDIENCE_OPTIONS[key].findIndex((o) => o.value === value),
  );

export default function PrivacyScreen() {
  const basic = usePrivacySettings();
  const advanced = useAccountPrivacy();
  const saveBasic = useSavePrivacySettings();
  const saveAdvanced = useSaveAccountPrivacy();

  if (basic.isPending || advanced.isPending) return <Loader />;
  const b: SettingsResponse | undefined = basic.data;
  const a = advanced.data;
  if (!b || !a) return <Notice>Could not load your privacy settings.</Notice>;

  const saveAudience = (key: AudienceKey, value: string) =>
    saveBasic.mutate({
      privacy_settings: toIndex(
        'privacy_settings',
        key === 'privacy_settings' ? value : b.privacy_settings,
      ),
      bio_settings: toIndex('bio_settings', key === 'bio_settings' ? value : b.bio_settings),
      like_dislike_settings: toIndex(
        'like_dislike_settings',
        key === 'like_dislike_settings' ? value : b.like_dislike_settings,
      ),
      allow_requests: b.allow_requests ?? true,
      acc_visibility: b.acc_visibility ?? true,
    });

  return (
    <ScrollView
      className="flex-1 bg-surface dark:bg-neutral-950"
      contentContainerClassName="p-4 pb-12"
    >
      {saveBasic.isError || saveAdvanced.isError ? (
        <Notice>Could not save. Please try again.</Notice>
      ) : null}

      <SectionTitle>Visibility</SectionTitle>
      <Card>
        {AUDIENCE_KEYS.map((key) => (
          <ToggleGroup key={key} title={AUDIENCE_TITLES[key]}>
            <Segmented
              options={AUDIENCE_OPTIONS[key]}
              value={b[key]}
              onChange={(v) => saveAudience(key, v)}
            />
          </ToggleGroup>
        ))}
      </Card>

      <SectionTitle>Who can follow me</SectionTitle>
      <Card>
        <ToggleGroup title="Follow requests from">
          <Segmented
            options={[
              { label: 'Anyone', value: 'anyone' as const },
              { label: 'Friends of friends', value: 'friends_of_friends' as const },
              { label: 'No one', value: 'no_one' as const },
            ]}
            value={a.follow_request_audience}
            onChange={(v) => saveAdvanced.mutate({ follow_request_audience: v })}
          />
        </ToggleGroup>
      </Card>

      <SectionTitle>Account</SectionTitle>
      <Card>
        {ACCOUNT_TOGGLES.map(({ key, title, subtitle }) => (
          <ToggleRow
            key={key}
            title={title}
            subtitle={subtitle}
            value={a[key]}
            onChange={(next) => saveAdvanced.mutate({ [key]: next })}
          />
        ))}
      </Card>
    </ScrollView>
  );
}

function ToggleGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="border-b border-border pt-3.5 dark:border-neutral-800">
      <Text className="mb-2.5 px-4 text-base font-medium text-ink dark:text-white">{title}</Text>
      {children}
    </View>
  );
}
