import { Text, View } from 'react-native';

import { Avatar } from './avatar';
import { handle, timeAgo } from './format';

type Props = {
  photoUrl?: string | null;
  firstName: string;
  lastName?: string;
  username?: string;
  createdAt?: string;
  body: string;
};

export function CommentItem({ photoUrl, firstName, lastName, username, createdAt, body }: Props) {
  return (
    <View className="flex-row gap-3 border-b border-border px-4 py-3">
      <Avatar uri={photoUrl} size={36} />
      <View className="flex-1">
        <Text className="font-semibold text-ink dark:text-white">
          {firstName} {lastName}
          <Text className="font-normal text-brand-2"> {handle(username)}</Text>
        </Text>
        {createdAt ? <Text className="text-xs text-muted">{timeAgo(createdAt)}</Text> : null}
        <Text className="mt-1 text-base text-ink dark:text-white">{body}</Text>
      </View>
    </View>
  );
}
