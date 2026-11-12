export type Reaction = 'like' | 'dislike';

export type AuthSession = {
  accessToken: string;
  userId: string;
  email: string;
};

export type AuthState = {
  status: 'loading' | 'signedOut' | 'signedIn';
  session: AuthSession | null;
};

export type FollowStatus = 'pending' | 'approved' | 'rejected' | null;

export type User = {
  id: string;
  username: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  bio: string;
  avatar?: number;
  photoUrl?: string;
  coverUrl?: string;
  followers: number;
  following: number;
  isFollowing?: boolean;
  followRequest?: FollowStatus;
  isActivated?: boolean;
  location?: string;
  threeWords?: string;
  loves?: string;
  dislikes?: string;
};

export type Post = {
  id: string;
  author: User;
  /** Which side of Moodflik the post lives on. */
  type?: 'like' | 'dislike';
  mine?: boolean;
  askWhy?: boolean;
  whyLikes?: number;
  whyDislikes?: number;
  mood: string;
  content: string;
  why?: string;
  createdAt: string;
  likes: number;
  dislikes: number;
  comments: number;
  reacted?: Reaction;
  favourite?: boolean;
  media?: { uri: string; type: 'image' | 'video' }[];
};

export type Comment = {
  id: string;
  postId: string;
  author: User;
  body: string;
  createdAt: string;
  replies?: Comment[];
};

export type Thread = {
  id: string;
  title: string;
  post: Post;
  comments: number;
  createdAt: string;
};

export type NotificationKind =
  | 'reaction'
  | 'follow'
  | 'follow-request'
  | 'comment'
  | 'favourite'
  | 'message'
  | 'message-request'
  | 'mention'
  | 'thread'
  | 'post';

export type Notification = {
  id: string;
  kind?: NotificationKind;
  postId?: string;
  requestId?: string;
  roomId?: string;
  actor?: User;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  sentAt?: number;
  mediaUri?: string;
};

export type AskThread = {
  id: string;
  postId: string;
  question: string;
  author: User;
  answers: number;
  createdAt: string;
};

export type MessageRequest = {
  id: string;
  roomId: string;
  sender: User;
  message: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  participant: User;
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
};

export type NavigationParams = {
  postId?: string;
  userId?: string;
  conversationId?: string;
  fromTrendingSection?: boolean;
};
