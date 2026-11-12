import type {
  AskThread,
  Comment,
  Conversation,
  FollowStatus,
  Message,
  MessageRequest,
  Notification,
  NotificationKind,
  Post,
  User,
} from '@/types/moodflik';

/* Raw shapes returned by the Django API (only the fields the app reads). */

type RawUser = {
  uuid: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  photo_url?: string | null;
  cover_photo_url?: string | null;
  city?: string | null;
  country?: string | null;
  me?: string | null;
  like?: string | null;
  dislike?: string | null;
  is_following?: boolean;
  follow_request_status?: FollowStatus;
  is_activated?: boolean;
};

type RawPost = {
  uuid: string;
  posted_by: string;
  user?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string | null;
  created_at: string;
  posted_time?: string;
  content?: string | null;
  post_type: string;
  mood_type?: string;
  why_content?: string | null;
  media_url?: string | null;
  like_count: number;
  dislike_count: number;
  comments_count: number;
  is_like?: boolean;
  is_dislike?: boolean;
  is_favourite?: boolean;
  enable_ask_why?: boolean;
  why_like_count?: number | null;
  why_dislike_count?: number | null;
};

type RawComment = {
  uuid: string;
  post: string;
  user: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string | null;
  comment: string;
  created_at: string;
};

/* Dates ------------------------------------------------------------- */

/** The API sends UTC either as ISO strings or as "YYYY-MM-DD HH:MM:SS". */
export function parseServerDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const normalized = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value.replace(' ', 'T')}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function timeAgo(value: string | null | undefined, now = new Date()): string {
  const date = parseServerDate(value);
  if (!date) return '';
  const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds} secs ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function clockTime(value: string | null | undefined): string {
  const date = parseServerDate(value);
  if (!date) return '';
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/** DD/MM/YYYY (the sign-up field) to the ISO date the API expects. */
export function toIsoDate(value: string): string {
  const [day, month, year] = value.split('/');
  return `${year}-${month}-${day}`;
}

/* Users ------------------------------------------------------------- */

const fullName = (first?: string, last?: string, fallback = '') =>
  `${first ?? ''} ${last ?? ''}`.trim() || fallback;

export function mapUser(raw: RawUser, counts?: { followers: number; following: number }): User {
  const username = raw.username ?? '';
  return {
    id: raw.uuid,
    username,
    displayName: fullName(raw.first_name, raw.last_name, username),
    firstName: raw.first_name,
    lastName: raw.last_name,
    bio: raw.bio ?? '',
    photoUrl: raw.photo_url || undefined,
    coverUrl: raw.cover_photo_url || undefined,
    followers: counts?.followers ?? 0,
    following: counts?.following ?? 0,
    isFollowing: raw.is_following,
    followRequest: raw.follow_request_status ?? null,
    isActivated: raw.is_activated,
    location: [raw.city, raw.country].filter(Boolean).join(', ') || undefined,
    threeWords: raw.me || undefined,
    loves: raw.like || undefined,
    dislikes: raw.dislike || undefined,
  };
}

/* Posts ------------------------------------------------------------- */

const isVideo = (url: string) => /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);

export function mapPost(raw: RawPost, currentUserId?: string | null): Post {
  const type = raw.post_type === 'dislike' ? 'dislike' : 'like';
  const author: User = {
    id: raw.posted_by,
    username: raw.user ?? '',
    displayName: fullName(raw.first_name, raw.last_name, raw.user ?? ''),
    bio: '',
    photoUrl: raw.photo_url || undefined,
    followers: 0,
    following: 0,
  };
  return {
    id: raw.uuid,
    author,
    type,
    mine: !!currentUserId && raw.posted_by === currentUserId,
    askWhy: raw.enable_ask_why ?? true,
    whyLikes: raw.why_like_count ?? 0,
    whyDislikes: raw.why_dislike_count ?? 0,
    mood: raw.mood_type || (type === 'dislike' ? 'I dislike' : 'I’m loving'),
    content: raw.content ?? '',
    why: raw.why_content || undefined,
    createdAt: raw.posted_time || timeAgo(raw.created_at),
    likes: raw.like_count,
    dislikes: raw.dislike_count,
    comments: raw.comments_count,
    reacted: raw.is_like ? 'like' : raw.is_dislike ? 'dislike' : undefined,
    favourite: !!raw.is_favourite,
    media: raw.media_url
      ? [{ uri: raw.media_url, type: isVideo(raw.media_url) ? 'video' : 'image' }]
      : undefined,
  };
}

export function mapComment(raw: RawComment): Comment {
  return {
    id: raw.uuid,
    postId: raw.post,
    author: {
      id: raw.user,
      username: raw.username ?? '',
      displayName: fullName(raw.first_name, raw.last_name, raw.username ?? ''),
      bio: '',
      photoUrl: raw.photo_url || undefined,
      followers: 0,
      following: 0,
    },
    body: raw.comment,
    createdAt: timeAgo(raw.created_at),
  };
}

export function mapThread(raw: Record<string, unknown>): AskThread {
  const get = (key: string) => (raw[key] as string | undefined) ?? '';
  return {
    id: get('uuid'),
    postId: get('post'),
    question: get('name'),
    author: {
      id: get('user'),
      username: get('username'),
      displayName: fullName(get('first_name'), get('last_name'), get('username')),
      bio: '',
      photoUrl: get('photo_url') || undefined,
      followers: 0,
      following: 0,
    },
    answers: Number(raw.comments_count ?? 0),
    createdAt: timeAgo(get('created_at')),
  };
}

/* Notifications ----------------------------------------------------- */

type RawNotification = {
  uuid: string;
  notification_type: string;
  message: string;
  seen: boolean;
  datetime: string;
  from_user: RawUser & { uuid: string };
  post_id: string | null;
  post_content: string | null;
  comment_text: string | null;
  chat_room: { chat_room: string } | null;
  follow_request: { request_id: string; status: string; incoming: boolean } | null;
};

export function notificationKind(
  raw: Pick<RawNotification, 'notification_type' | 'follow_request'>,
) {
  switch (raw.notification_type) {
    case 'reaction':
      return 'reaction';
    case 'comment':
      return 'comment';
    case 'favourite':
      return 'favourite';
    case 'follow':
      return 'follow';
    case 'friend_request':
      return raw.follow_request?.incoming && raw.follow_request.status === 'pending'
        ? 'follow-request'
        : 'follow';
    case 'chat':
      return 'message';
    case 'dm_request':
      return 'message-request';
    case 'mention':
      return 'mention';
    case 'new_thread':
    case 'thread_comment':
    case 'post_comment_on_thread':
      return 'thread';
    case 'post_upload':
    case 'posted':
      return 'post';
    default:
      return 'reaction';
  }
}

export function mapNotification(raw: RawNotification): Notification {
  const actor = mapUser(raw.from_user);
  const kind: NotificationKind = notificationKind(raw);
  // The API sends whole sentences ("bob reacted to your post."); the UI shows the @handle separately.
  const title = raw.message.startsWith(actor.username)
    ? raw.message.slice(actor.username.length).trim()
    : raw.message;
  return {
    id: raw.uuid,
    kind,
    actor,
    postId: raw.post_id ?? undefined,
    requestId: raw.follow_request?.request_id,
    roomId: raw.chat_room?.chat_room,
    title,
    body: raw.comment_text ?? raw.post_content ?? '',
    time: timeAgo(raw.datetime),
    read: raw.seen,
  };
}

/* Chat -------------------------------------------------------------- */

type RawRoom = {
  room_id: string;
  chat_name: string | null;
  image: string | null;
  date_modified: string | null;
  unseen_message_count: number | null;
  latest_message: string | null;
  participants: {
    user: {
      uuid: string;
      username?: string;
      first_name: string;
      last_name: string;
      photo_url: string | null;
    }[];
  };
};

export function mapRoom(raw: RawRoom, meId: string): Conversation {
  const other =
    raw.participants.user.find((user) => user.uuid !== meId) ?? raw.participants.user[0];
  const participant: User = other
    ? mapUser(other)
    : {
        id: '',
        username: '',
        displayName: raw.chat_name ?? 'Conversation',
        bio: '',
        followers: 0,
        following: 0,
      };
  return {
    id: raw.room_id,
    participant,
    lastMessage: raw.latest_message ?? '',
    updatedAt: timeAgo(raw.date_modified),
    unreadCount: raw.unseen_message_count ?? 0,
  };
}

export type RawChat = { uuid: string; message: string; datetime: string; user: string };

export function mapMessage(raw: RawChat, conversationId: string): Message {
  return {
    id: raw.uuid,
    conversationId,
    senderId: raw.user,
    body: raw.message,
    createdAt: clockTime(raw.datetime),
    sentAt: parseServerDate(raw.datetime)?.getTime(),
  };
}

type RawChatRequest = {
  id: number;
  room_id: string;
  message: string;
  timestamp: string;
  sender_info: RawUser;
};

export function mapMessageRequest(raw: RawChatRequest): MessageRequest {
  return {
    id: String(raw.id),
    roomId: raw.room_id,
    sender: mapUser(raw.sender_info),
    message: raw.message,
    createdAt: timeAgo(raw.timestamp),
  };
}
