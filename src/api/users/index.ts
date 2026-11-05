import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { api } from '@/api/client';
import type {
  AccountActionBody,
  AccountActionResult,
  AccountPrivacySettings,
  AccountPrivacySettingsBody,
  ContactUsBody,
  FollowRequest,
  InviteBody,
  PatchedUserWritable,
  PostNotificationBody,
  SettingsBody,
  SettingsResponse,
  User,
} from '@/api/generated/types.gen';
import {
  zFollowListResponse,
  zGeneralNotificationsSaved,
  zGeneralNotificationsState,
  zMuteListResponse,
  zMuteResult,
  zSpecificNotificationList,
} from '@/api/generated/zod.gen';
import { tokens } from '@/lib/secure';

export type { AccountPrivacySettings, FollowRequest, SettingsResponse, User };

export type UserLite = Pick<User, 'uuid' | 'first_name' | 'last_name' | 'photo_url' | 'email'> & {
  username?: string | null;
};

/* ------------------------------ keys ------------------------------ */

export const userKeys = {
  all: ['users'] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
  follows: (id?: string) => ['users', 'follows', id ?? 'me'] as const,
  search: (q: string) => ['users', 'search', q] as const,
  blocked: ['users', 'blocked'] as const,
  muted: ['users', 'muted'] as const,
  privacy: ['users', 'privacy'] as const,
  accountPrivacy: ['users', 'account-privacy'] as const,
  notifications: ['users', 'notification-settings'] as const,
  requestsIn: ['users', 'follow-requests', 'received'] as const,
  requestsOut: ['users', 'follow-requests', 'sent'] as const,
};

/* ---------------------------- current user --------------------------- */

function decodeUserId(token: string | null): string | null {
  if (!token) return null;
  try {
    const part = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!part) return null;
    const json = globalThis.atob(part.padEnd(part.length + ((4 - (part.length % 4)) % 4), '='));
    const claims = JSON.parse(json) as { user_id?: string };
    return claims.user_id ?? null;
  } catch {
    return null;
  }
}

/** UUID of the signed-in user, read from the JWT `user_id` claim. */
export function useMeId() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    void tokens.getAccess().then((t) => setId(decodeUserId(t)));
  }, []);
  return id;
}

export function displayName(u?: Pick<UserLite, 'first_name' | 'last_name' | 'username'> | null) {
  if (!u) return '';
  const full = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
  return full || u.username || '';
}

export function handle(u?: Pick<UserLite, 'username'> | null) {
  const name = u?.username ?? '';
  return name ? (name.startsWith('@') ? name : `@${name}`) : '';
}

/* ------------------------------ profile ------------------------------ */

export function useUser(id?: string | null) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () => (await api.get<User>(`user/${id}/`)).data,
  });
}

export function useMe() {
  const id = useMeId();
  return { id, ...useUser(id) };
}

export function useUpdateUser(id?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: PatchedUserWritable) =>
      (await api.patch<User>(`user/${id}/`, patch)).data,
    onSuccess: (user) => {
      if (id) qc.setQueryData(userKeys.detail(id), user);
    },
  });
}

/** Uploads through the Django `upload/` endpoint, so no AWS keys ship in the app. */
export async function uploadImage(uri: string, dirName = 'profile', mime = 'image/jpeg') {
  const name = uri.split('/').pop() ?? `upload-${Date.now()}.jpg`;
  const form = new FormData();
  form.append('file', { uri, name, type: mime } as unknown as Blob);
  form.append('dir_name', dirName);
  const { data } = await api.post<{ file_url?: string; url?: string }>('upload/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const url = data.file_url ?? data.url;
  if (!url) throw new Error('Upload failed');
  return url;
}

/* ----------------------------- follow graph ----------------------------- */

export function useFollowLists(userId?: string) {
  return useQuery({
    queryKey: userKeys.follows(userId),
    queryFn: async () => {
      const { data } = await api.get<unknown>('follow/', {
        params: userId ? { user_id: userId } : undefined,
      });
      return zFollowListResponse.parse(data).data;
    },
  });
}

export function useRemoveFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'following' | 'followers' }) =>
      api.delete(`remove_follow/${id}`, { params: { type } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users', 'follows'] }),
  });
}

export function useSendFollowRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (receiver: string) =>
      (
        await api.post<{ message?: string; response?: string }>('send_follow_request/', {
          receiver,
        })
      ).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useReceivedRequests() {
  return useQuery({
    queryKey: userKeys.requestsIn,
    queryFn: async () => (await api.get<FollowRequest[]>('list_received_follow_request/')).data,
  });
}

export function useSentRequests() {
  return useQuery({
    queryKey: userKeys.requestsOut,
    queryFn: async () => (await api.get<FollowRequest[]>('list_sent_follow_request/')).data,
  });
}

export function useRequestDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      decision,
    }: {
      id: string;
      decision: 'approve' | 'reject' | 'cancel';
    }) => (await api.post(`${decision}_follow_request/`, { request_id: id })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

/* ------------------------------- search ------------------------------- */

export function useUserSearch(q: string, opts: { hideBlocked?: boolean } = {}) {
  const term = q.trim();
  return useQuery({
    queryKey: [...userKeys.search(term), !!opts.hideBlocked],
    enabled: term.length > 0,
    queryFn: async () =>
      (
        await api.get<User[]>('unblock_users/', {
          params: { search: term, ...(opts.hideBlocked ? { block: true } : {}) },
        })
      ).data,
  });
}

/** Debounces fast-changing input (search boxes). */
export function useDebounced<T>(value: T, ms = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/* ------------------------------ block / mute ------------------------------ */

export function useBlockedUsers() {
  return useQuery({
    queryKey: userKeys.blocked,
    queryFn: async () => (await api.get<User[]>('block_user/')).data,
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user_id: string) =>
      (await api.post<string>('block_user/', { user_id })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user_id: string) =>
      (await api.post<string>('unblock_user/', { user_id })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useMutedUsers() {
  return useQuery({
    queryKey: userKeys.muted,
    queryFn: async () => zMuteListResponse.parse((await api.get<unknown>('mute_user/')).data),
  });
}

export function useMuteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ user_id, action }: { user_id: string; action: 'mute' | 'unmute' }) =>
      zMuteResult.parse((await api.post<unknown>('mute_user/', { user_id, action })).data),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.muted }),
  });
}

/* ---------------------------- settings: privacy ---------------------------- */

export function usePrivacySettings() {
  return useQuery({
    queryKey: userKeys.privacy,
    queryFn: async () => (await api.get<SettingsResponse>('privacy_setting/')).data,
  });
}

export function useSavePrivacySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: SettingsBody) => (await api.post('privacy_setting/', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.privacy }),
  });
}

export function useAccountPrivacy() {
  return useQuery({
    queryKey: userKeys.accountPrivacy,
    queryFn: async () => (await api.get<AccountPrivacySettings>('privacy_setting_advanced/')).data,
  });
}

export function useSaveAccountPrivacy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: AccountPrivacySettingsBody) =>
      (await api.post('privacy_setting_advanced/', body)).data,
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: userKeys.accountPrivacy });
      const prev = qc.getQueryData<AccountPrivacySettings>(userKeys.accountPrivacy);
      if (prev) qc.setQueryData(userKeys.accountPrivacy, { ...prev, ...body });
      return { prev };
    },
    onError: (_e, _b, ctx) => {
      if (ctx?.prev) qc.setQueryData(userKeys.accountPrivacy, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: userKeys.accountPrivacy }),
  });
}

/* ------------------------- settings: notifications ------------------------- */

export type NotificationSettings = Record<keyof PostNotificationBody, boolean>;

export function useNotificationSettings() {
  return useQuery({
    queryKey: userKeys.notifications,
    queryFn: async () => {
      const { data } = await api.get<{ data: Partial<NotificationSettings> }>(
        'post_notifications/',
      );
      return data.data;
    },
  });
}

export function useSaveNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: PostNotificationBody) =>
      (await api.post('post_notifications/', body)).data,
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: userKeys.notifications });
      const prev = qc.getQueryData<Partial<NotificationSettings>>(userKeys.notifications);
      qc.setQueryData(userKeys.notifications, { ...prev, ...body });
      return { prev };
    },
    onError: (_e, _b, ctx) => qc.setQueryData(userKeys.notifications, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: userKeys.notifications }),
  });
}

/* --------------------------- password / account --------------------------- */

export function useChangePassword() {
  return useMutation({
    mutationFn: async (body: {
      old_password: string;
      new_password1: string;
      new_password2: string;
    }) => (await api.put<{ message: string }>('change_password/', body)).data,
  });
}

export type AccountAction = AccountActionBody['action'];

export function useAccountAction(id?: string | null) {
  return useMutation({
    mutationFn: async (body: AccountActionBody) =>
      (await api.post<AccountActionResult>(`user/${id}/account-action/`, body)).data,
  });
}

/* ------------------------------ contact / invite ------------------------------ */

export function useContactUs() {
  return useMutation({
    mutationFn: async (body: ContactUsBody) =>
      (await api.post<{ status: boolean; message: string }>('contact_us/', body)).data,
  });
}

export function useInviteUser() {
  return useMutation({
    mutationFn: async (body: InviteBody) =>
      (await api.post<{ status: boolean; message: string }>('invite_user/', body)).data,
  });
}

/** Pulls the first human-readable message out of a DRF / envelope error. */
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.detail === 'string') return obj.detail;
    for (const v of Object.values(obj)) {
      if (typeof v === 'string') return v;
      if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
    }
  }
  return fallback;
}

/* ------------------------ settings: general / per-user notifications ------------------------ */

export type GeneralNotificationsPatch = {
  allow_notifications?: boolean;
  allow_mentions?: boolean;
  categories?: Record<string, Record<string, boolean>>;
  extras?: Record<string, boolean>;
};

export type SpecificNotificationType =
  'comment' | 'likes_dislikes' | 'why_reactions' | 'why_comments' | 'thread' | 'mentions';

export function useGeneralNotificationSettings() {
  return useQuery({
    queryKey: ['users', 'notifications', 'general'] as const,
    queryFn: async () =>
      zGeneralNotificationsState.parse(
        (await api.get<unknown>('notifications/general_notifications_settings/')).data,
      ),
  });
}

export function usePatchGeneralNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: GeneralNotificationsPatch) =>
      zGeneralNotificationsSaved.parse(
        (await api.patch<unknown>('notifications/general_notifications_settings/', patch)).data,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users', 'notifications'] }),
  });
}

export function useSpecificNotifications() {
  return useQuery({
    queryKey: ['users', 'notifications', 'specific'] as const,
    queryFn: async () =>
      zSpecificNotificationList.parse(
        (await api.get<unknown>('notifications/specific_notifications/')).data,
      ),
  });
}

export function useToggleSpecificNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { type: SpecificNotificationType; target: string; action: boolean }) =>
      (await api.patch<string>('notifications/specific_notifications/', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users', 'notifications', 'specific'] }),
  });
}
