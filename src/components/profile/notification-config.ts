import type { NotificationSettings } from '@/api/users';

export type NotificationGroup = {
  title: string;
  subtitle: string;
  options: { key: keyof NotificationSettings; title: string }[];
};

export const notificationGroups: NotificationGroup[] = [
  {
    title: 'Mood activity',
    subtitle: 'Stay in the loop when moods shift and stories unfold.',
    options: [
      { key: 'like_dislike', title: 'Someone reacts to your post (agree/disagree)' },
      { key: 'comments', title: 'Someone comments on your post' },
      { key: 'why_reactions', title: 'Someone reacts to your Why? insight' },
      { key: 'why_comments', title: 'Someone comments on your Why? insight' },
    ],
  },
  {
    title: 'Push notifications',
    subtitle: 'Pick what lights up your lock screen.',
    options: [
      { key: 'push_likes_dislikes', title: 'Likes/dislikes on my posts' },
      { key: 'push_comments', title: 'Comments on my posts' },
      { key: 'push_why_reactions', title: 'Reactions to my Why? insights' },
      { key: 'push_why_comments', title: 'Comments on my Why? insights' },
    ],
  },
  {
    title: 'Followers & connections',
    subtitle: 'Who is joining and leaving your circle.',
    options: [
      { key: 'follow_notif', title: 'Someone follows you' },
      { key: 'unfollow_notif', title: 'Someone unfollows you' },
      { key: 'followed_user_new_mood', title: 'Someone you follow posts a new mood' },
      { key: 'followed_user_new_why', title: 'Someone you follow adds a Why? insight' },
    ],
  },
  {
    title: 'Mentions & tags',
    subtitle: 'When they can\u2019t stop thinking about you.',
    options: [
      { key: 'mentions', title: 'Someone mentions you in their post' },
      { key: 'tags_in_why', title: 'Someone tags you in their Why?' },
    ],
  },
  {
    title: 'Messages',
    subtitle: 'When they slide into your DMs.',
    options: [
      { key: 'new_direct_message', title: 'New direct message' },
      { key: 'dm_requests', title: 'Message request from someone you don\u2019t follow' },
      { key: 'chat_alert', title: 'Chat alert' },
    ],
  },
  {
    title: 'General',
    subtitle: 'The essentials. Or not. You decide.',
    options: [
      { key: 'weekly_digest', title: 'Weekly digest of your Moodflik highlights' },
      { key: 'product_updates', title: 'Product updates & new features' },
      { key: 'tips_tricks', title: 'Moodflik tips & tricks' },
    ],
  },
];
