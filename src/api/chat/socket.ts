import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { addMessage, dropPending, markSeen, upsertMessages } from '@/db/messages';
import { useMyUserId } from '@/lib/me';
import { tokens } from '@/lib/secure';
import { wsUrl } from '@/lib/ws';

import { chatKeys, fetchMessages, sendPrivateMessage } from './index';

type ServerEvent =
  | { type: 'chat'; uuid: string; message: string; user: string; datetime: string }
  | { type: 'chat_status'; uuid: string; status: string[] }
  | { type: 'online_users'; users: { uuid: string; username: string }[] }
  | { type: 'error' | 'Invalid_room_id' | 'user_blocked'; message: string };

export type SocketState = 'connecting' | 'open' | 'closed';

/** Live connection to /ws/chat/<room_id>/. Falls back to the HTTP endpoint while offline. */
export function useChatSocket(roomId: string, peerId?: string) {
  const qc = useQueryClient();
  const me = useMyUserId();
  const socket = useRef<WebSocket | null>(null);
  const [state, setState] = useState<SocketState>('connecting');
  const [online, setOnline] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctl: { closed: boolean; attempt: number; retry?: ReturnType<typeof setTimeout> } = {
      closed: false,
      attempt: 0,
    };

    void fetchMessages(roomId).then((chats) => {
      if (!ctl.closed) upsertMessages(roomId, chats);
    });

    const connect = async () => {
      const access = await tokens.getAccess();
      if (ctl.closed || !access) return;
      setState('connecting');
      const ws = new WebSocket(`${wsUrl(`chat/${roomId}/`)}?token=${encodeURIComponent(access)}`);
      socket.current = ws;

      ws.addEventListener('open', () => {
        ctl.attempt = 0;
        setState('open');
        setError(null);
      });
      ws.addEventListener('message', (event) => {
        const data = JSON.parse(String(event.data)) as ServerEvent;
        if (data.type === 'chat') {
          if (data.user === me) dropPending(roomId, data.message);
          addMessage(roomId, {
            uuid: data.uuid,
            message: data.message,
            user: data.user,
            datetime: data.datetime,
          });
          void qc.invalidateQueries({ queryKey: chatKeys.rooms });
        } else if (data.type === 'chat_status') {
          markSeen(data.uuid, data.status);
        } else if (data.type === 'online_users') {
          setOnline(data.users.map((u) => u.uuid));
        } else {
          setError(data.message);
        }
      });
      ws.addEventListener('close', () => {
        setState('closed');
        if (ctl.closed) return;
        ctl.attempt += 1;
        ctl.retry = setTimeout(() => void connect(), Math.min(15_000, 1_000 * 2 ** ctl.attempt));
      });
      ws.addEventListener('error', () => ws.close());
    };
    void connect();

    return () => {
      ctl.closed = true;
      if (ctl.retry) clearTimeout(ctl.retry);
      socket.current?.close();
      socket.current = null;
    };
  }, [roomId, me, qc]);
  const send = useCallback(
    async (text: string) => {
      const body = text.trim();
      if (!body || !me) return;
      addMessage(roomId, {
        uuid: `pending-${Date.now()}`,
        message: body,
        user: me,
        datetime: new Date().toISOString(),
        pending: true,
      });
      const ws = socket.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ message: body }));
      } else if (peerId) {
        await sendPrivateMessage({ receiver: peerId, message: body, roomId });
        const chats = await fetchMessages(roomId);
        upsertMessages(roomId, chats);
      }
    },
    [roomId, peerId, me],
  );

  return { state, online, error, send };
}
