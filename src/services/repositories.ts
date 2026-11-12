import type {
  AskThread,
  AuthSession,
  Comment,
  Conversation,
  Message,
  MessageRequest,
  Notification,
  Post,
  Reaction,
  Thread,
  User,
} from '@/types/moodflik';
import { ApiError, request, uploadFile, type PickedFile } from './api';
import {
  mapComment,
  mapMessage,
  mapMessageRequest,
  mapNotification,
  mapPost,
  mapRoom,
  mapThread,
  mapUser,
  toIsoDate,
  type RawChat,
} from './mappers';

export type Page<T> = { items: T[]; nextCursor: string | null };
export type Side = 'like' | 'dislike';

type Paginated<T> = { results: T[]; next: string | null };
// eslint-friendly alias for the loosely typed JSON the backend returns.
type Json = Record<string, any>; // oxlint-disable-line no-explicit-any

/** Id of the signed-in user; set by AuthContext so mapped posts know which are "mine". */
let currentUserId: string | null = null;
export const setCurrentUserId = (id: string | null) => {
  currentUserId = id;
};

const pageOf = <T>(data: Paginated<Json>, map: (raw: Json) => T, page: number): Page<T> => ({
  items: data.results.map(map),
  nextCursor: data.next ? String(page + 1) : null,
});

const genderCode: Record<string, string> = {
  Male: 'M',
  Female: 'F',
  Other: 'N',
  'Prefer not to say': 'N',
};

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export type SignUpInput = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  dob: string; // DD/MM/YYYY
  gender: string;
};

export const authService = {
  async signIn(email: string, password: string): Promise<AuthSession> {
    const result = await request<{ data: { accessToken: string; uuid: string; email: string } }>(
      '/user/authorize/',
      {
        method: 'POST',
        body: { email: email.trim(), password },
        auth: false,
        fallbackError: 'Please check your email and password.',
      },
    );
    return {
      accessToken: result.data.accessToken,
      userId: result.data.uuid,
      email: result.data.email,
    };
  },

  async signUp(input: SignUpInput): Promise<AuthSession> {
    try {
      await request('/user/', {
        method: 'POST',
        auth: false,
        body: {
          username: input.username.trim(),
          email: input.email.trim(),
          password: input.password,
          first_name: input.firstName.trim(),
          last_name: input.lastName.trim(),
          date_of_birth: toIsoDate(input.dob),
          gender: genderCode[input.gender] ?? 'N',
          terms_confirmed: true,
          client_type: 'mobile',
        },
        fallbackError: 'Unable to create your account.',
      });
    } catch (reason: unknown) {
      if (reason instanceof ApiError && reason.status === 409)
        throw new ApiError('An account with this email already exists.', 409, { cause: reason });
      throw reason;
    }
    return authService.signIn(input.email, input.password);
  },

  async requestPasswordReset(email: string): Promise<void> {
    await request('/user/request_forgotpassword/', {
      method: 'POST',
      auth: false,
      body: { email: email.trim() },
      fallbackError: 'We could not send the reset code.',
    });
  },

  /** Checks the emailed code and returns the one-time code needed to set the new password. */
  async verifyOtp(email: string, code: string): Promise<string> {
    const result = await request<{ data: { otp_code: number } }>('/validate-otp/', {
      method: 'POST',
      auth: false,
      body: { email: email.trim(), code, validation_type: 'forgot password' },
      fallbackError: 'That code is not valid.',
    });
    return String(result.data.otp_code);
  },

  async resetPassword(email: string, changeCode: string, password: string): Promise<void> {
    await request('/forget_password/', {
      method: 'PATCH',
      auth: false,
      body: { email: email.trim(), code: changeCode, password },
      fallbackError: 'We could not change your password.',
    });
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await request('/change_password/', {
      method: 'PATCH',
      body: {
        old_password: oldPassword,
        new_password1: newPassword,
        new_password2: newPassword,
      },
      fallbackError: 'We could not change your password.',
    });
  },

  async resendActivation(email: string): Promise<void> {
    await request('/user/resend_activation/', {
      method: 'POST',
      auth: false,
      body: { email: email.trim() },
    });
  },

  async closeAccount(
    userId: string,
    action: 'delete' | 'deactivate',
    reason: string,
    details = '',
  ): Promise<void> {
    await request(`/user/${userId}/account-action/`, {
      method: 'POST',
      body: { action, reason, details },
      fallbackError: 'We could not update your account.',
    });
  },
};

/* ------------------------------------------------------------------ */
/* Posts                                                               */
/* ------------------------------------------------------------------ */

export type PostInput = {
  side: Side;
  mood: string;
  content: string;
  why?: string;
  /** A local file URI picked by the user; uploaded before the post is saved. */
  mediaFile?: PickedFile;
  /** Existing media URL kept when editing without picking a new file. */
  mediaUrl?: string;
};

export const feedService = {
  async list(side: Side, cursor?: string): Promise<Page<Post>> {
    const page = cursor ? Number(cursor) : 1;
    const data = await request<Paginated<Json>>('/post/', {
      query: { type: side, limit: 20, page },
      fallbackError: 'We could not load moods.',
    });
    return pageOf(data, (raw) => mapPost(raw as never, currentUserId), page);
  },

  async favourites(side: Side): Promise<Post[]> {
    const data = await request<Paginated<Json>>('/favourites/', {
      query: { type: side, limit: 50 },
    });
    return data.results.map((raw) => mapPost(raw as never, currentUserId));
  },

  async byUser(userId: string, side?: Side): Promise<Post[]> {
    const data = await request<Paginated<Json>>('/my_posts/', {
      query: { user_id: userId, type: side, limit: 50 },
    });
    return data.results.map((raw) => mapPost(raw as never, currentUserId));
  },

  async trending(): Promise<Post[]> {
    const data = await request<Paginated<Json>>('/most_seen/', {
      query: { limit: 20 },
      fallbackError: 'Trending moods are unavailable.',
    });
    return data.results.map((raw) => mapPost(raw as never, currentUserId));
  },

  async get(postId: string): Promise<Post> {
    const raw = await request<Json>(`/post_by_id/${postId}`, {
      fallbackError: 'That post is no longer available.',
    });
    return mapPost(raw as never, currentUserId);
  },

  /** Toggles the reaction (sending the same one again removes it). Returns fresh counts. */
  async toggleReaction(
    postId: string,
    reaction: Reaction,
  ): Promise<{ likes: number; dislikes: number }> {
    const result = await request<{ data?: Json; message?: string }>('/reactions/', {
      method: 'POST',
      body: { post: postId, reaction },
    });
    if (!result.data) throw new ApiError(result.message ?? 'You cannot react to this post.', 200);
    return { likes: result.data.like_count, dislikes: result.data.dislike_count };
  },

  async toggleFavourite(postId: string): Promise<void> {
    await request('/favourites/', { method: 'POST', body: { post: postId } });
  },

  async share(postId: string): Promise<void> {
    await request('/increase_share_count/', { method: 'POST', body: { post_id: postId } });
  },

  async report(postId: string, reason: string): Promise<void> {
    await request('/post_report/', {
      method: 'POST',
      body: { post: postId, reason },
      fallbackError: 'We could not report this post.',
    });
  },
};

export const postService = {
  async create(input: PostInput): Promise<Post> {
    if (!input.mood.trim() || !input.content.trim())
      throw new Error('Add a mood and tell the community what is on your mind.');
    const mediaUrl = input.mediaFile ? await uploadFile(input.mediaFile, 'img') : undefined;
    const raw = await request<Json>('/post/', {
      method: 'POST',
      body: {
        post_type: input.side,
        mood_type: input.mood,
        content: input.content.trim(),
        why_content: input.why?.trim() || null,
        media_url: mediaUrl ?? null,
        content_type: mediaUrl ? 'media' : 'text',
      },
      fallbackError: 'Unable to share this post.',
    });
    return feedService.get(raw.uuid);
  },

  async update(id: string, input: PostInput): Promise<Post> {
    if (!input.mood.trim() || !input.content.trim())
      throw new Error('Add a mood and tell the community what is on your mind.');
    const mediaUrl = input.mediaFile ? await uploadFile(input.mediaFile, 'img') : input.mediaUrl;
    await request(`/post_update/${id}`, {
      method: 'PATCH',
      body: {
        mood_type: input.mood,
        content: input.content.trim(),
        why_content: input.why?.trim() || null,
        media_url: mediaUrl ?? null,
      },
      fallbackError: 'Unable to save this post.',
    });
    return feedService.get(id);
  },

  async remove(id: string): Promise<void> {
    await request(`/post_update/${id}`, { method: 'DELETE', fallbackError: 'Unable to delete.' });
  },

  async toggleAskWhy(id: string): Promise<boolean> {
    const result = await request<{ enable_ask_why: boolean }>(
      `/post/${id}/toggle_new_ask_why_permission/`,
      { method: 'PATCH' },
    );
    return result.enable_ask_why;
  },
};

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

type FollowLists = { followers: User[]; following: User[]; count: number; dmCount: number };

async function followLists(userId: string): Promise<FollowLists> {
  const result = await request<{
    data: { followers: Json[]; following: Json[]; count: number; dm_count: number };
  }>('/follow/', { query: { user_id: userId } });
  return {
    followers: result.data.followers.map((raw) => mapUser(raw as never)),
    following: result.data.following.map((raw) => mapUser(raw as never)),
    count: result.data.count,
    dmCount: result.data.dm_count,
  };
}

export const profileService = {
  followLists,

  async getUser(id: string): Promise<User> {
    const [raw, lists] = await Promise.all([
      request<Json>(`/user/${id}/`, { fallbackError: 'This profile is no longer available.' }),
      followLists(id).catch(() => null),
    ]);
    return mapUser(raw as never, {
      followers: lists?.followers.length ?? 0,
      following: lists?.following.length ?? 0,
    });
  },

  async listUsers(query = ''): Promise<Page<User>> {
    const data = await request<Json[]>('/usersfilters/', {
      query: { search: query.trim() },
      fallbackError: 'Search is unavailable right now.',
    });
    return { items: data.map((raw) => mapUser(raw as never)), nextCursor: null };
  },

  /** Counts for the header badges: [notifications, direct messages]. */
  async counts(userId: string): Promise<{ notifications: number; messages: number }> {
    const lists = await followLists(userId);
    return { notifications: lists.count, messages: lists.dmCount };
  },

  async updateProfile(
    userId: string,
    fields: Partial<{
      firstName: string;
      lastName: string;
      bio: string;
      city: string;
      threeWords: string;
      loves: string;
      dislikes: string;
      photoUrl: string;
      coverUrl: string;
    }>,
  ): Promise<User> {
    const body: Json = {};
    if (fields.firstName !== undefined) body.first_name = fields.firstName;
    if (fields.lastName !== undefined) body.last_name = fields.lastName;
    if (fields.bio !== undefined) body.bio = fields.bio;
    if (fields.city !== undefined) body.city = fields.city;
    if (fields.threeWords !== undefined) body.me = fields.threeWords;
    if (fields.loves !== undefined) body.like = fields.loves;
    if (fields.dislikes !== undefined) body.dislike = fields.dislikes;
    if (fields.photoUrl !== undefined) body.photo_url = fields.photoUrl;
    if (fields.coverUrl !== undefined) body.cover_photo_url = fields.coverUrl;
    const raw = await request<Json>(`/user/${userId}/`, {
      method: 'PATCH',
      body,
      fallbackError: 'We could not save your profile.',
    });
    return mapUser(raw as never);
  },

  async uploadAvatar(userId: string, file: PickedFile): Promise<User> {
    const url = await uploadFile(file, 'avatars');
    return profileService.updateProfile(userId, { photoUrl: url });
  },

  async uploadCover(userId: string, file: PickedFile): Promise<User> {
    const url = await uploadFile(file, 'covers');
    return profileService.updateProfile(userId, { coverUrl: url });
  },

  /** Sends a follow request. Resolves to the resulting state. */
  async follow(userId: string): Promise<'pending' | 'approved'> {
    const result = await request<{ status?: 'pending' | 'approved' }>('/send_follow_request/', {
      method: 'POST',
      body: { receiver: userId },
      fallbackError: 'We could not send the follow request.',
    });
    return result.status ?? 'pending';
  },

  async unfollow(userId: string): Promise<void> {
    await request(`/remove_follow/${userId}`, { method: 'DELETE', query: { type: 'following' } });
  },

  async removeFollower(userId: string): Promise<void> {
    await request(`/remove_follow/${userId}`, { method: 'DELETE' });
  },

  async respondToRequest(requestId: string, accept: boolean): Promise<void> {
    await request(accept ? '/approve_follow_request/' : '/reject_follow_request/', {
      method: 'POST',
      body: { request_id: requestId },
      fallbackError: 'We could not update that request.',
    });
  },

  async block(userId: string): Promise<void> {
    await request('/block_user/', { method: 'POST', body: { user_id: userId } });
  },

  async unblock(userId: string): Promise<void> {
    await request('/unblock_user/', { method: 'POST', body: { user_id: userId } });
  },

  async listBlocked(): Promise<User[]> {
    const data = await request<Json[]>('/block_user/');
    return data.map((raw) => mapUser(raw as never));
  },

  async mute(userId: string, mute = true): Promise<void> {
    await request('/mute_user/', {
      method: 'POST',
      body: { user_id: userId, action: mute ? 'mute' : 'unmute' },
    });
  },

  async listMuted(): Promise<User[]> {
    const data = await request<{ muted_users: Json[] }>('/mute_user/');
    return data.muted_users.map((raw) => mapUser(raw as never));
  },
};

/* ------------------------------------------------------------------ */
/* Comments & "Ask why" threads                                        */
/* ------------------------------------------------------------------ */

export const commentsService = {
  async list(postId: string): Promise<Comment[]> {
    const data = await request<Json[]>(`/get_post_comments/${postId}`);
    return data.map((raw) => mapComment(raw as never));
  },

  async create(postId: string, comment: string): Promise<Comment> {
    const result = await request<{ comment?: Json; message?: string }>('/comment/', {
      method: 'POST',
      body: { post: postId, comment: comment.trim() },
      fallbackError: 'We could not post your comment.',
    });
    if (!result.comment)
      throw new ApiError(result.message ?? 'We could not post your comment.', 200);
    return mapComment(result.comment as never);
  },
};

export const askWhyService = {
  async listThreads(postId: string): Promise<AskThread[]> {
    const result = await request<{ data: Json[] }>(`/post_threads/${postId}`);
    return result.data.map(mapThread);
  },

  async createThread(postId: string, question: string): Promise<AskThread> {
    try {
      const result = await request<{ data: Json }>(`/post_threads/${postId}`, {
        method: 'POST',
        body: { name: question.trim() },
      });
      return mapThread(result.data);
    } catch (reason: unknown) {
      if (reason instanceof ApiError && reason.status === 406)
        throw new ApiError('The author turned off new questions for this post.', 406, {
          cause: reason,
        });
      throw reason;
    }
  },

  async listAnswers(threadId: string): Promise<Comment[]> {
    const result = await request<{ data: Json[] }>(`/threads/${threadId}/comments/`);
    return result.data.map((raw) => mapComment({ ...raw, post: raw.thread } as never));
  },

  async answer(threadId: string, text: string): Promise<Comment> {
    const result = await request<{ data: Json }>(`/threads/${threadId}/comments/`, {
      method: 'POST',
      body: { comment: text.trim() },
    });
    return mapComment({ ...result.data, post: result.data.thread } as never);
  },

  async reactToWhy(postId: string, reaction: Reaction): Promise<void> {
    await request('/why_reactions/', { method: 'POST', body: { post: postId, reaction } });
  },
};

export const threadService = {
  /** "Trending moods": the most seen posts across Moodflik (public endpoint). */
  async list(): Promise<Thread[]> {
    const posts = await feedService.trending();
    return posts.map((post) => ({
      id: post.id,
      title: post.mood,
      post,
      comments: post.comments,
      createdAt: post.createdAt,
    }));
  },
};

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export const notificationService = {
  async list(): Promise<Notification[]> {
    const data = await request<Json[]>('/all_notifications/');
    return data.map((raw) => mapNotification(raw as never));
  },

  async markSeen(id: string): Promise<void> {
    await request(`/notification_detail/${id}/`);
  },

  async markAllSeen(): Promise<void> {
    await request('/notifications/mark_all_seen/', { method: 'POST' });
  },
};

/* ------------------------------------------------------------------ */
/* Chat                                                                */
/* ------------------------------------------------------------------ */

export const chatService = {
  async listConversations(meId: string): Promise<Conversation[]> {
    const data = await request<Json[]>('/chat/list_rooms/');
    return data.map((raw) => mapRoom(raw as never, meId));
  },

  async listMessages(roomId: string): Promise<Message[]> {
    try {
      const data = await request<RawChat[]>('/chat/get_message/', { query: { room_id: roomId } });
      return data.map((raw) => mapMessage(raw, roomId));
    } catch (reason: unknown) {
      // A room that does not exist yet simply has no messages.
      if (reason instanceof ApiError && reason.status === 404) return [];
      throw reason;
    }
  },

  async send(
    receiverId: string,
    text: string,
    roomId?: string,
  ): Promise<{ roomId: string; message: Message }> {
    const result = await request<{ room_id: string; chat: RawChat }>('/chat/send_message/', {
      method: 'POST',
      body: { action: 'private', receiver: receiverId, message: text.trim(), room_id: roomId },
      fallbackError: 'We could not send your message.',
    });
    return { roomId: result.room_id, message: mapMessage(result.chat, result.room_id) };
  },

  async sendRequest(receiverId: string, text: string): Promise<void> {
    await request('/chat/dm_requests/', {
      method: 'POST',
      body: { type: 'private', receiver: receiverId, message: text.trim() },
      fallbackError: 'We could not send your message request.',
    });
  },

  async listRequests(): Promise<MessageRequest[]> {
    const data = await request<Json[]>('/chat/handle_dm_requests/');
    return data.map((raw) => mapMessageRequest(raw as never));
  },

  async respondToRequest(roomId: string, accept: boolean): Promise<void> {
    await request('/chat/handle_dm_requests/', {
      method: 'PATCH',
      body: { action: accept ? 'accept_request' : 'reject_request', room_id: roomId },
      fallbackError: 'We could not update that request.',
    });
  },

  /** People the user follows: the pool for starting a new conversation. */
  async friends(): Promise<User[]> {
    const data = await request<Paginated<Json>>('/friends/', { query: { limit: 100 } });
    return data.results.map((raw) => mapUser(raw as never));
  },
};

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export type PrivacySettings = {
  privateProfile: boolean;
  allowMessageRequests: boolean;
  showOnlineStatus: boolean;
  searchable: boolean;
  allowComments: boolean;
  showMoodHistory: boolean;
};

export type NotificationOption = { key: string; label: string; value: boolean };
export type NotificationCategory = { key: string; label: string; options: NotificationOption[] };

export const settingsService = {
  async getPrivacy(): Promise<PrivacySettings> {
    const [basic, advanced] = await Promise.all([
      request<Json>('/privacy_setting/'),
      request<Json>('/privacy_setting_advanced/'),
    ]);
    return {
      privateProfile: basic.privacy_settings === 1 || basic.privacy_settings === 'OnlyFollowers',
      allowMessageRequests: basic.allow_requests !== false,
      showOnlineStatus: advanced.show_online_status !== false,
      searchable: advanced.username_search_visible !== false,
      allowComments: advanced.allow_comments !== false,
      showMoodHistory: advanced.show_mood_history !== false,
    };
  },

  async savePrivacy(settings: PrivacySettings): Promise<void> {
    await Promise.all([
      request('/privacy_setting/', {
        method: 'POST',
        body: {
          privacy_settings: settings.privateProfile ? 1 : 0,
          allow_requests: settings.allowMessageRequests,
        },
      }),
      request('/privacy_setting_advanced/', {
        method: 'POST',
        body: {
          show_online_status: settings.showOnlineStatus,
          username_search_visible: settings.searchable,
          allow_comments: settings.allowComments,
          show_mood_history: settings.showMoodHistory,
        },
      }),
    ]);
  },

  async getNotificationSettings(): Promise<NotificationCategory[]> {
    const data = await request<{ categories: NotificationCategory[] }>(
      '/notifications/general_notifications_settings/',
    );
    return data.categories;
  },

  async setNotificationOption(category: string, option: string, value: boolean): Promise<void> {
    await request('/notifications/general_notifications_settings/', {
      method: 'PATCH',
      body: { categories: { [category]: { [option]: value } } },
      fallbackError: 'We could not save that setting.',
    });
  },

  async contact(name: string, email: string, message: string): Promise<void> {
    await request('/contact_us/', {
      method: 'POST',
      body: { name, email, message },
      fallbackError: 'We could not send your message.',
    });
  },

  async invite(email: string): Promise<void> {
    await request('/invite_user/', {
      method: 'POST',
      body: { email: email.trim() },
      fallbackError: 'We could not send the invitation.',
    });
  },
};
