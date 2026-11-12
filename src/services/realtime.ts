import { WS_BASE, getAuthToken } from './api';

export type Socket = {
  send: (payload: unknown) => boolean;
  close: () => void;
  isOpen: () => boolean;
};

/**
 * Opens an authenticated WebSocket to the Django Channels server.
 * `reconnect` keeps retrying with a delay until `close()` is called (used for notifications).
 */
export function openSocket(
  path: string,
  onMessage: (data: Record<string, unknown>) => void,
  options: { reconnect?: boolean; onOpen?: () => void } = {},
): Socket {
  let socket: WebSocket | null = null;
  let closed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const connect = () => {
    const token = getAuthToken();
    if (closed || !token) return;
    socket = new WebSocket(`${WS_BASE}${path}?token=${encodeURIComponent(token)}`);
    socket.onopen = () => options.onOpen?.();
    socket.onmessage = (event) => {
      try {
        onMessage(JSON.parse(String(event.data)) as Record<string, unknown>);
      } catch (reason: unknown) {
        console.error('Ignoring malformed socket message', reason);
      }
    };
    socket.onclose = () => {
      socket = null;
      if (options.reconnect && !closed) timer = setTimeout(connect, 5000);
    };
    socket.onerror = () => socket?.close();
  };
  connect();

  return {
    isOpen: () => socket?.readyState === WebSocket.OPEN,
    send: (payload) => {
      if (socket?.readyState !== WebSocket.OPEN) return false;
      socket.send(JSON.stringify(payload));
      return true;
    },
    close: () => {
      closed = true;
      if (timer) clearTimeout(timer);
      socket?.close();
    },
  };
}
