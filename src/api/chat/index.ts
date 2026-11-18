import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { z } from 'zod';

import { api } from '@/api/client';
import type {
  Chat,
  ChatRequest,
  ChatRoom,
  PatchedHandleDmRequest,
  SendDmRequest,
  SendMessageRequest,
  User,
} from '@/api/generated/types.gen';
import { zChat, zChatRequest, zChatRoom } from '@/api/generated/zod.gen';

export type { Chat, ChatRequest, ChatRoom };
export type ChatUser = Pick<User, 'uuid' | 'first_name' | 'last_name' | 'username' | 'photo_url'>;

export const chatKeys = {
  rooms: ['chat', 'rooms'] as const,
  messages: (roomId: string) => ['chat', 'messages', roomId] as const,
  requests: ['chat', 'requests'] as const,
  users: (search: string) => ['chat', 'users', search] as const,
};

/** Types come from the OpenAPI schema; runtime drift is only reported, never fatal. */
function check<T>(schema: z.ZodType, data: unknown): T {
  if (__DEV__) {
    const result = schema.safeParse(data);
    if (!result.success) console.warn('[api] response drift', result.error.issues.slice(0, 3));
  }
  return data as T;
}

export async function fetchRooms() {
  const { data } = await api.get<unknown>('chat/list_rooms/');
  return check<ChatRoom[]>(z.array(zChatRoom), data);
}

export async function fetchMessages(roomId: string) {
  try {
    const { data } = await api.get<unknown>('chat/get_message/', { params: { room_id: roomId } });
    return check<Chat[]>(z.array(zChat), data);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return [];
    throw error;
  }
}

export async function fetchDmRequests() {
  try {
    const { data } = await api.get<unknown>('chat/handle_dm_requests/');
    return check<ChatRequest[]>(z.array(zChatRequest), data);
  } catch (error) {
    // The API answers 404 when nothing is pending.
    if (isAxiosError(error) && error.response?.status === 404) return [];
    throw error;
  }
}

export async function searchUsers(search: string) {
  const { data } = await api.get<ChatUser[]>('usersfilters/', { params: { search, block: true } });
  return data;
}

export const sendPrivateMessage = (input: {
  receiver: string;
  message: string;
  roomId?: string;
}) => {
  const body: SendMessageRequest = {
    action: 'private',
    message: input.message,
    receiver: input.receiver,
    ...(input.roomId ? { room_id: input.roomId } : {}),
  };
  return api.post<string>('chat/send_message/', body);
};

export const sendDmRequest = (body: SendDmRequest) => api.post<string>('chat/dm_requests/', body);

export const handleDmRequest = (body: PatchedHandleDmRequest) =>
  api.patch<string>('chat/handle_dm_requests/', body);

export const setRoomNotifications = (roomId: string, enabled: boolean) =>
  api.patch<string>('chat/user_prefrence_chat_notifications/', {
    room_id: roomId,
    action: enabled,
  });

export const useRooms = () => useQuery({ queryKey: chatKeys.rooms, queryFn: fetchRooms });

export const useMessages = (roomId: string) =>
  useQuery({ queryKey: chatKeys.messages(roomId), queryFn: () => fetchMessages(roomId) });

export const useDmRequests = () =>
  useQuery({ queryKey: chatKeys.requests, queryFn: fetchDmRequests });

export const useUserSearch = (search: string) =>
  useQuery({
    queryKey: chatKeys.users(search),
    queryFn: () => searchUsers(search),
    enabled: search.trim().length > 1,
  });

export function useSendDmRequest() {
  return useMutation({ mutationFn: sendDmRequest });
}

export function useHandleDmRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: handleDmRequest,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.requests });
      void qc.invalidateQueries({ queryKey: chatKeys.rooms });
    },
  });
}

export function useRoomNotifications() {
  return useMutation({
    mutationFn: (v: { roomId: string; enabled: boolean }) =>
      setRoomNotifications(v.roomId, v.enabled),
  });
}

/** Message body conventions shared with the previous app: `[<id|url>][post|image]`. */
export type MessageKind =
  | { kind: 'text'; text: string }
  | { kind: 'post'; postId: string }
  | { kind: 'image'; url: string };

export function parseMessage(body: string): MessageKind {
  const match = /^\[([^\]]+)\]\[(post|image)\]$/.exec(body.trim());
  if (!match) return { kind: 'text', text: body };
  return match[2] === 'post'
    ? { kind: 'post', postId: match[1] }
    : { kind: 'image', url: match[1] };
}

export const encodePostMessage = (postId: string) => `[${postId}][post]`;
export const encodeImageMessage = (url: string) => `[${url}][image]`;
