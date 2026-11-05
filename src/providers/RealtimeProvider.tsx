import { useQueryClient } from '@tanstack/react-query';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { chatKeys } from '@/api/chat';
import { notificationKeys } from '@/api/notifications';
import { listenForPushTaps, registerForPush, unregisterPush } from '@/api/notifications/push';
import { type NotificationRow, notificationsCollection, setCounters } from '@/db/notifications';
import { useAuth } from '@/lib/auth';
import { tokens } from '@/lib/secure';
import { wsUrl } from '@/lib/ws';

type Frame = {
  type: string;
  message: string;
  sender_image?: string | null;
  datetime?: string;
  count?: number;
  dm_count?: number;
} & Partial<
  Record<
    'comment' | 'favourite' | 'reaction' | 'follow' | 'chat_room' | 'follow_request',
    Record<string, string>
  >
>;

const RealtimeContext = createContext<{ connected: boolean }>({ connected: false });
export const useRealtime = () => useContext(RealtimeContext);

/** Owns the notification socket and push registration while the user is signed in. */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (status !== 'signedIn') return;
    const ctl: {
      closed: boolean;
      attempt: number;
      ws: WebSocket | null;
      retry?: ReturnType<typeof setTimeout>;
    } = { closed: false, attempt: 0, ws: null };

    const connect = async () => {
      const access = await tokens.getAccess();
      if (ctl.closed || !access) return;
      // The server identifies the user from the token; the path segment is a placeholder.
      const ws = new WebSocket(
        `${wsUrl('notification-server/me/')}?token=${encodeURIComponent(access)}`,
      );
      ctl.ws = ws;
      ws.addEventListener('open', () => {
        ctl.attempt = 0;
        setConnected(true);
      });
      ws.addEventListener('message', (event) => {
        const frame = JSON.parse(String(event.data)) as Frame;
        if (frame.type !== 'notification') return;
        const row: NotificationRow = {
          uuid: `live-${Date.now()}`,
          message: frame.message,
          count: frame.count ?? 0,
          seen: false,
          sender_image: frame.sender_image ?? null,
          datetime: frame.datetime ?? new Date().toISOString(),
          comment: frame.comment ?? null,
          favourite: frame.favourite ?? null,
          reaction: frame.reaction ?? null,
          follow: frame.follow ?? null,
          chat_room: frame.chat_room ?? null,
          follow_request: frame.follow_request ?? null,
          live: true,
        };
        notificationsCollection.insert(row);
        setCounters({ notifications: frame.count ?? 0, dms: frame.dm_count ?? 0 });
        if (frame.chat_room) void qc.invalidateQueries({ queryKey: chatKeys.rooms });
        if (frame.follow_request) {
          void qc.invalidateQueries({ queryKey: notificationKeys.received });
        }
      });
      ws.addEventListener('close', () => {
        setConnected(false);
        if (ctl.closed) return;
        ctl.attempt += 1;
        ctl.retry = setTimeout(() => void connect(), Math.min(30_000, 1_000 * 2 ** ctl.attempt));
      });
      ws.addEventListener('error', () => ws.close());
    };
    void connect();

    // Reconnect promptly when the app returns to the foreground.
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active' && (!ctl.ws || ctl.ws.readyState === WebSocket.CLOSED)) {
        void connect();
      }
    });

    void registerForPush().catch((e) => console.warn('[push]', e));
    const stopTaps = listenForPushTaps();

    return () => {
      ctl.closed = true;
      if (ctl.retry) clearTimeout(ctl.retry);
      ctl.ws?.close();
      appState.remove();
      stopTaps();
      void unregisterPush();
      setConnected(false);
    };
  }, [status, qc]);
  const value = useMemo(() => ({ connected }), [connected]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
