import type { Notification, Post, User } from '@/types/moodflik';

export const currentUser: User = {
  id: 'me',
  username: 'aliwaris',
  displayName: 'Ali Waris',
  bio: 'Sharing the moods that make us human.',
  followers: 248,
  following: 183,
  location: 'Lahore',
  threeWords: 'Desire, commitment, curiosity',
  loves: 'Football & Cricket',
  dislikes: 'Lies',
};

export const users: User[] = [
  currentUser,
  {
    id: 'maya',
    username: 'maya.j',
    displayName: 'Maya Johnson',
    bio: 'Finding joy in small things.',
    followers: 524,
    following: 91,
    location: 'London',
    threeWords: 'Calm, kind, curious',
    loves: 'Tea & sunrises',
    dislikes: 'Rushed mornings',
  },
  {
    id: 'sam',
    username: 'samwilson',
    displayName: 'Sam Wilson',
    bio: 'Curious, kind, and always learning.',
    followers: 312,
    following: 204,
    location: 'Manchester',
    threeWords: 'Honest, loud, loyal',
    loves: 'Road trips',
    dislikes: 'Long meetings',
  },
  {
    id: 'noor',
    username: 'noorwrites',
    displayName: 'Noor Ahmed',
    bio: 'Words, coffee, and honest conversations.',
    followers: 897,
    following: 76,
    location: 'Karachi',
    threeWords: 'Writer, dreamer, maker',
    loves: 'Books & coffee',
    dislikes: 'Writer’s block',
  },
];

export const posts: Post[] = [
  {
    id: 'p1',
    author: users[1],
    mood: "I'm loving",
    content: 'A slow morning, a warm cup of tea, and the feeling that everything will be okay.',
    why: 'It is easy to forget how restorative quiet moments can be.',
    createdAt: '12 mins ago',
    likes: 42,
    dislikes: 3,
    comments: 8,
    reacted: 'like',
    favourite: true,
  },
  {
    id: 'p2',
    author: users[2],
    mood: "I'm frustrated",
    content: 'When a meeting could have been an email, but becomes three meetings instead.',
    why: 'Some days need a little more patience than others.',
    createdAt: '38 mins ago',
    likes: 18,
    dislikes: 21,
    comments: 4,
  },
  {
    id: 'p3',
    author: users[3],
    mood: "I'm excited",
    content: 'New ideas are taking shape. Cannot wait to share what comes next!',
    why: 'The best part of creating is inviting others into the journey.',
    createdAt: '1 hr ago',
    likes: 67,
    dislikes: 2,
    comments: 15,
  },
  {
    id: 'p4',
    author: users[0],
    mood: "I'm loving",
    content: 'Great day at the cricket ground with friends.',
    createdAt: '2 hrs ago',
    likes: 12,
    dislikes: 0,
    comments: 0,
  },
  {
    id: 'p5',
    author: users[1],
    mood: 'I dislike',
    content: 'The fact that all my clothes got wet in the rain.',
    createdAt: '3 hrs ago',
    likes: 9,
    dislikes: 1,
    comments: 1,
  },
  {
    id: 'p6',
    author: users[3],
    mood: 'I dislike',
    content: 'The fact that I have to get up so early tomorrow morning.',
    why: 'Early flights are the worst.',
    createdAt: '5 hrs ago',
    likes: 22,
    dislikes: 4,
    comments: 2,
    favourite: true,
  },
];

export const notifications: Notification[] = [
  {
    id: 'n1',
    kind: 'reaction',
    actor: users[1],
    title: 'reacted to your post.',
    body: 'Great day at the cricket ground with friends.',
    time: '5 mins ago',
    read: false,
  },
  {
    id: 'n2',
    kind: 'follow',
    actor: users[2],
    title: 'started following you.',
    body: '',
    time: '2 hrs ago',
    read: false,
  },
  {
    id: 'n3',
    kind: 'comment',
    actor: users[3],
    title: 'commented on your post.',
    body: 'This really resonated with me.',
    time: 'Yesterday',
    read: true,
  },
  {
    id: 'n4',
    kind: 'follow-request',
    actor: users[3],
    title: 'sent you a follow request.',
    body: '',
    time: 'Yesterday',
    read: true,
  },
  {
    id: 'n5',
    kind: 'favourite',
    actor: users[1],
    title: 'added your post to favourites.',
    body: 'Great day at the cricket ground with friends.',
    time: '2 days ago',
    read: true,
  },
];

export const mockApi = {
  async getFeed(): Promise<Post[]> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return posts;
  },
  async search(query: string): Promise<User[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const normalized = query.toLowerCase();
    return users.filter((user) =>
      `${user.displayName} ${user.username}`.toLowerCase().includes(normalized),
    );
  },
};
