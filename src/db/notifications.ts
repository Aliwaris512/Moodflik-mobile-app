import { createCollection, localOnlyCollectionOptions, useLiveQuery } from '@tanstack/react-db';

import type { NotificationItem } from '@/api/generated/types.gen';

export type NotificationRow = {
  -readonly [K in keyof NotificationItem]: NotificationItem[K];
} & { live?: boolean };

export const notificationsCollection = createCollection(
  localOnlyCollectionOptions<NotificationRow, string>({
    id: 'notifications',
    getKey: (n) => n.uuid,
  }),
);

type Counters = { id: 'counters'; notifications: number; dms: number };

/** Single row holding the badge counts pushed by the notification socket. */
export const countersCollection = createCollection(
  localOnlyCollectionOptions<Counters, string>({
    id: 'counters',
    getKey: (c) => c.id,
  }),
);

export function setCounters(patch: Partial<Omit<Counters, 'id'>>) {
  if (countersCollection.has('counters')) {
    countersCollection.update('counters', (draft) => {
      Object.assign(draft, patch);
    });
  } else {
    countersCollection.insert({ id: 'counters', notifications: 0, dms: 0, ...patch });
  }
}

export function upsertNotifications(items: readonly NotificationItem[]) {
  for (const item of items) {
    const row = { ...item } as NotificationRow;
    if (notificationsCollection.has(row.uuid)) {
      notificationsCollection.update(row.uuid, (draft) => {
        Object.assign(draft, row);
      });
    } else {
      notificationsCollection.insert(row);
    }
  }
}

export function useNotificationRows(): NotificationRow[] {
  const { data } = useLiveQuery((q) => q.from({ n: notificationsCollection }));
  return (data as NotificationRow[]).toSorted((a, b) => b.datetime.localeCompare(a.datetime));
}

export function useBadgeCounts() {
  const { data } = useLiveQuery((q) => q.from({ c: countersCollection }));
  const row = (data as Counters[])[0];
  return { notifications: row?.notifications ?? 0, dms: row?.dms ?? 0 };
}
