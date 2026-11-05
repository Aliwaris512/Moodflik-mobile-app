import type { PostShow } from '@/api/posts/types';
import type { Post } from '@/types/moodflik';

/** Adapts an API post to the shape the existing PostCard renders. */
export function toPost(row: PostShow): Post {
  const type: 'image' | 'video' = /video/i.test(row.content_type ?? '') ? 'video' : 'image';
  const media = row.media_url ? [{ uri: row.media_url, type }] : undefined;
  return {
    id: row.uuid,
    author: {
      id: row.user,
      username: row.posted_by ?? '',
      displayName: `${row.first_name} ${row.last_name}`.trim(),
      bio: '',
      followers: 0,
      following: 0,
    },
    mood: row.mood_type || row.post_type,
    content: row.content ?? '',
    why: row.why_content ?? undefined,
    createdAt: row.posted_time,
    likes: row.like_count ?? 0,
    dislikes: row.dislike_count ?? 0,
    comments: row.comments_count ?? 0,
    reacted: row.is_like ? 'like' : row.is_dislike ? 'dislike' : undefined,
    favourite: row.is_favourite,
    media,
  };
}
