import { ScrollView, View } from 'react-native';

import { Card, Row, SectionTitle } from '@/components/profile/ui';
import { useAuth } from '@/lib/auth';

export default function Settings() {
  const { signOut } = useAuth();
  return (
    <ScrollView
      className="flex-1 bg-surface dark:bg-neutral-950"
      contentContainerClassName="p-4 pb-12"
    >
      <SectionTitle>Account</SectionTitle>
      <Card>
        <Row title="Edit profile" href="/profile/edit" />
        <Row title="Privacy" subtitle="Who can see you and your moods" href="/settings/privacy" />
        <Row title="Notifications" href="/settings/notifications" />
        <Row title="Change password" href="/settings/change-password" />
      </Card>

      <SectionTitle>Safety</SectionTitle>
      <Card>
        <Row title="Blocked users" href="/settings/blocked" />
        <Row title="Mute & report" href="/settings/mute-report" />
      </Card>

      <SectionTitle>Community</SectionTitle>
      <Card>
        <Row title="Find people" href="/user/search" />
        <Row title="Invite friends" href="/settings/invite" />
        <Row title="Help & FAQ" href="/settings/help" />
        <Row title="Contact us" href="/settings/contact" />
        <Row title="About & legal" href="/legal" />
      </Card>

      <SectionTitle>Danger zone</SectionTitle>
      <Card>
        <Row title="Delete or deactivate account" destructive href="/settings/delete-account" />
        <Row title="Sign out" destructive onPress={() => void signOut()} />
      </Card>
      <View className="h-4" />
    </ScrollView>
  );
}
