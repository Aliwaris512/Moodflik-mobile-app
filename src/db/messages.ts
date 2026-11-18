import { createCollection, localOnlyCollectionOptions, useLiveQuery } from '@tanstack/react-db';

import type { Chat } from '@/api/generated/types.gen';

export type MessageRow = {
  uuid: string;
  room: string;
  message: string;
  user: string;
  datetime: string;
  seenBy: string[];
  pending?: boolean;
};

/** Reactive message store. HTTP history and WebSocket frames both land here. */
export const messagesCollection = createCollection(
  localOnlyCollectionOptions<MessageRow, string>({
    id: 'messages',
    getKey: (m) => m.uuid,
  }),
);

type Incoming = Pick<MessageRow, 'uuid' | 'message' | 'user' | 'datetime'> &
  Partial<Pick<MessageRow, 'seenBy' | 'pending'>>;

export function addMessage(room: string, m: Incoming) {
  const row: MessageRow = { seenBy: [], ...m, room };
  if (messagesCollection.has(row.uuid)) {
    messagesCollection.update(row.uuid, (draft) => {
      Object.assign(draft, row);
    });
  } else {
    messagesCollection.insert(row);
  }
}

export function upsertMessages(room: string, chats: readonly Chat[]) {
  for (const chat of chats) {
    addMessage(room, {
      uuid: chat.uuid,
      message: chat.message,
      user: chat.user,
      datetime: chat.datetime,
      seenBy: chat.chatstatus_set.filter((s) => s.status === 'seen').map((s) => s.user),
    });
  }
}

/** Remove the optimistic copy once the server echoes the real message. */
export function dropPending(room: string, text: string) {
  for (const row of messagesCollection.values()) {
    if (row.room === room && row.pending && row.message === text) {
      messagesCollection.delete(row.uuid);
      return;
    }
  }
}

export function markSeen(uuid: string, seenBy: string[]) {
  if (!messagesCollection.has(uuid)) return;
  messagesCollection.update(uuid, (draft) => {
    draft.seenBy = seenBy;
  });
}

export function useRoomMessages(room: string): MessageRow[] {
  const { data } = useLiveQuery((q) =>
    q.from({ m: messagesCollection }).where(({ m }) => m.room === room),
  );
  return (data as MessageRow[]).toSorted((a, b) => a.datetime.localeCompare(b.datetime));
}
