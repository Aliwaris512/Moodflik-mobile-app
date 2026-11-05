import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { z } from 'zod';

import { api } from '@/api/client';
import type { FollowRequest, NotificationItem } from '@/api/generated/types.gen';
import { zNotificationItem } from '@/api/generated/zod.gen';
import { setCounters, upsertNotifications } from '@/db/notifications';

export type { FollowRequest, NotificationItem };

export const notificationKeys = {
  list: ['notifications', 'list'] as const,
  received: ['notifications', 'follow-received'] as const,
  sent: ['notifications', 'follow-sent'] as const,
};

export async function fetchNotifications() {
  const { data } = await api.get<NotificationItem[]>('all_notifications/');
  if (__DEV__) {
    const parsed = z.array(zNotificationItem).safeParse(data);
    if (!parsed.success) console.warn('[api] notification drift', parsed.error.issues.slice(0, 3));
  }
  // Server resets the unread counter when the list is read.
  upsertNotifications(data);
  setCounters({ notifications: 0 });
  return data;
}

export const useNotifications = () =>
  useQuery({ queryKey: notificationKeys.list, queryFn: fetchNotifications });

export const useReceivedFollowRequests = () =>
  useQuery({
    queryKey: notificationKeys.received,
    queryFn: async () => (await api.get<FollowRequest[]>('list_received_follow_request/')).data,
  });

export const useSentFollowRequests = () =>
  useQuery({
    queryKey: notificationKeys.sent,
    queryFn: async () => (await api.get<FollowRequest[]>('list_sent_follow_request/')).data,
  });

type FollowAction = 'approve' | 'reject' | 'cancel';

export function useFollowRequestAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ action, requestId }: { action: FollowAction; requestId: string }) =>
      api.post(`${action}_follow_request/`, { request_id: requestId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.received });
      void qc.invalidateQueries({ queryKey: notificationKeys.sent });
    },
  });
}

type Ref = Record<string, string> | null | undefined;
type Payload = Partial<
  Record<
    | 'comment'
    | 'favourite'
    | 'reaction'
    | 'mention'
    | 'post_upload'
    | 'follow'
    | 'chat_room'
    | 'dm_request'
    | 'thread',
    Ref
  >
>;

/** Where a notification (stored or pushed) should take the user. */
export function hrefForNotification(n: Payload): Href | null {
  const post = n.comment ?? n.favourite ?? n.reaction ?? n.mention ?? n.post_upload;
  if (post?.post_id) return `/post/${post.post_id}` as Href;
  if (n.chat_room?.chat_room) {
    const name = encodeURIComponent(n.chat_room.user ?? 'Chat');
    return `/chat/${n.chat_room.chat_room}?name=${name}` as Href;
  }
  if (n.dm_request) return '/chat/requests' as Href;
  if (n.follow?.user_id) return `/user/${n.follow.user_id}` as Href;
  if (n.thread?.thread_id) return `/thread/${n.thread.thread_id}` as Href;
  return null;
}
