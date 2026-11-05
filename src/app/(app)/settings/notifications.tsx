import { ScrollView, Text } from 'react-native';

import { useNotificationSettings, useSaveNotificationSettings } from '@/api/users';
import { notificationGroups } from '@/components/profile/notification-config';
import { Card, Notice, SectionTitle, ToggleRow } from '@/components/profile/ui';
import { Loader } from '@/components/ui';

export default function NotificationSettingsScreen() {
  const { data, isPending, isError } = useNotificationSettings();
  const save = useSaveNotificationSettings();

  if (isPending) return <Loader />;
  if (isError || !data) return <Notice>Could not load notification settings.</Notice>;

  return (
    <ScrollView
      className="flex-1 bg-surface dark:bg-neutral-950"
      contentContainerClassName="p-4 pb-12"
    >
      {save.isError ? <Notice>Could not save. Please try again.</Notice> : null}
      <ToggleRow
        title="Allow notifications"
        subtitle="Master switch for everything below"
        value={!!data.allow_notif}
        onChange={(next) => save.mutate({ allow_notif: next })}
      />
      {notificationGroups.map((group) => (
        <Card key={group.title}>
          <SectionTitle>{group.title}</SectionTitle>
          <Text className="mb-2 px-4 text-sm text-muted dark:text-neutral-400">
            {group.subtitle}
          </Text>
          {group.options.map((opt) => (
            <ToggleRow
              key={opt.key}
              title={opt.title}
              value={!!data[opt.key]}
              disabled={data.allow_notif === false}
              onChange={(next) => save.mutate({ [opt.key]: next })}
            />
          ))}
        </Card>
      ))}
    </ScrollView>
  );
}
