import { describe, expect, test } from 'bun:test';
import type { PostShow } from '@/api/posts/types';
import { toPost } from './postMapper';

const row = {
  uuid: 'p1',
  user: 'u1',
  first_name: 'Maya',
  last_name: 'Lee',
  photo_url: null,
  posted_time: '2h ago',
  posted_by: 'maya',
  created_at: '2026-11-05T10:00:00Z',
  updated_at: '2026-11-05T10:00:00Z',
  content: 'Loving this sunset',
  content_type: 'video/mp4',
  post_type: 'like',
  mood_type: 'I’m loving',
  why_content: 'Golden hour',
  like_count: 4,
  dislike_count: 1,
  comments_count: 2,
  media_url: 'https://cdn.example/clip.mp4',
  is_favourite: true,
  is_like: true,
  is_comment: false,
  is_seen: false,
  is_dislike: false,
  is_muted: false,
  tagged_users: [],
  is_like_dislike: true,
} satisfies PostShow;

describe('toPost', () => {
  test('maps API fields onto the card shape', () => {
    const post = toPost(row);
    expect(post.id).toBe('p1');
    expect(post.author.displayName).toBe('Maya Lee');
    expect(post.mood).toBe('I’m loving');
    expect(post.likes).toBe(4);
    expect(post.reacted).toBe('like');
    expect(post.favourite).toBe(true);
    expect(post.media).toEqual([{ uri: 'https://cdn.example/clip.mp4', type: 'video' }]);
  });

  test('falls back to safe defaults', () => {
    const post = toPost({
      ...row,
      content: null,
      mood_type: '',
      media_url: null,
      like_count: undefined,
      is_like: false,
    });
    expect(post.content).toBe('');
    expect(post.mood).toBe('like');
    expect(post.likes).toBe(0);
    expect(post.reacted).toBeUndefined();
    expect(post.media).toBeUndefined();
  });
});
