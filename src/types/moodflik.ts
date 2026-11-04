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

export type User = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatar?: number;
  followers: number;
  following: number;
  isFollowing?: boolean;
  location?: string;
  threeWords?: string;
  loves?: string;
  dislikes?: string;
};

export type Post = {
  id: string;
  author: User;
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

export type NotificationKind = 'reaction' | 'follow' | 'follow-request' | 'comment' | 'favourite';

export type Notification = {
  id: string;
  kind?: NotificationKind;
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
  mediaUri?: string;
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
