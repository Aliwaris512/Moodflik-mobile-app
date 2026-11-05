import type {
  AuthSession,
  Comment,
  Conversation,
  Message,
  Notification,
  Post,
  Thread,
  User,
} from '@/types/moodflik';
import { currentUser, notifications, posts, users } from './mockService';

export type Page<T> = { items: T[]; nextCursor: string | null };

const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  async signIn(email: string, password: string): Promise<AuthSession> {
    await wait();
    if (!email.includes('@') || password.length < 6)
      throw new Error('Please check your email and password.');
    return { accessToken: 'mock-access-token', userId: currentUser.id, email };
  },
  async signUp(email: string, password: string, displayName: string): Promise<AuthSession> {
    await wait();
    if (!displayName.trim() || !email.includes('@') || password.length < 6)
      throw new Error('Enter your name, a valid email, and a password of at least 6 characters.');
    return { accessToken: 'mock-access-token', userId: currentUser.id, email };
  },
  async requestPasswordReset(email: string): Promise<void> {
    await wait();
    if (!email.includes('@')) throw new Error('Please enter a valid email address.');
  },
};

export const feedService = {
  async list(cursor?: string): Promise<Page<Post>> {
    await wait(350);
    const start = cursor ? Number(cursor) : 0;
    return {
      items: posts.slice(start, start + 10),
      nextCursor: start + 10 < posts.length ? String(start + 10) : null,
    };
  },
  async toggleReaction(postId: string, reaction: 'like' | 'dislike'): Promise<Post> {
    await wait(120);
    const post = posts.find((item) => item.id === postId);
    if (!post) throw new Error('That post is no longer available.');
    return { ...post, reacted: reaction };
  },
};

export const postService = {
  async create(input: Pick<Post, 'mood' | 'content' | 'why' | 'media'>): Promise<Post> {
    await wait();
    if (!input.mood.trim() || !input.content.trim())
      throw new Error('Add a mood and tell the community what is on your mind.');
    return {
      ...posts[0],
      ...input,
      id: `post-${Date.now()}`,
      author: currentUser,
      createdAt: 'Just now',
      likes: 0,
      dislikes: 0,
      comments: 0,
    };
  },
  async update(id: string, input: Pick<Post, 'mood' | 'content' | 'why' | 'media'>): Promise<Post> {
    await wait();
    const original = posts.find((post) => post.id === id);
    if (!original) throw new Error('That post could not be found.');
    return { ...original, ...input };
  },
};

export const profileService = {
  async getUser(id: string): Promise<User> {
    await wait();
    const user = users.find((item) => item.id === id);
    if (!user) throw new Error('This profile is no longer available.');
    return user;
  },
  async listUsers(query = ''): Promise<Page<User>> {
    await wait(200);
    const normalized = query.trim().toLowerCase();
    const result = users.filter((user) =>
      `${user.displayName} ${user.username}`.toLowerCase().includes(normalized),
    );
    return { items: result, nextCursor: null };
  },
};

export const commentsService = {
  async list(postId: string): Promise<Comment[]> {
    await wait();
    return [
      {
        id: 'comment-1',
        postId,
        author: users[1],
        body: 'This is exactly how I feel today.',
        createdAt: '8 mins ago',
      },
    ];
  },
};

export const threadService = {
  async list(): Promise<Thread[]> {
    await wait();
    return posts.map((post) => ({
      id: `thread-${post.id}`,
      title: post.mood,
      post,
      comments: post.comments,
      createdAt: post.createdAt,
    }));
  },
};

export const notificationService = {
  async list(): Promise<Notification[]> {
    await wait();
    return notifications;
  },
};

export const chatService = {
  async listConversations(): Promise<Conversation[]> {
    await wait();
    return users.slice(1).map((participant, index) => ({
      id: `conversation-${participant.id}`,
      participant,
      lastMessage: index ? 'See you soon!' : 'That really resonated with me.',
      updatedAt: index ? '2 hrs ago' : '5 mins ago',
      unreadCount: index ? 0 : 2,
    }));
  },
  async listMessages(conversationId: string): Promise<Message[]> {
    await wait();
    return [
      {
        id: 'message-1',
        conversationId,
        senderId: users[1].id,
        body: 'That really resonated with me.',
        createdAt: '5 mins ago',
      },
    ];
  },
};

export const settingsService = {
  async updateProfile(input: Pick<User, 'displayName' | 'bio'>): Promise<User> {
    await wait();
    return { ...currentUser, ...input };
  },
};
