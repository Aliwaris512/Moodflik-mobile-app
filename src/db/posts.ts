import { createCollection, eq, localOnlyCollectionOptions, useLiveQuery } from '@tanstack/react-db';

import type { Comments, PostEntity, PostShow } from '@/api/posts/types';

/**
 * Normalised, reactive store for posts and comments. Screens page data through TanStack Query,
 * then mirror rows here so optimistic updates (reactions, favourites, new comments) show
 * everywhere the same post is rendered.
 */
export const postsCollection = createCollection(
  localOnlyCollectionOptions<PostEntity, string>({
    id: 'posts',
    getKey: (post) => post.uuid,
  }),
);

export type CommentEntity = { -readonly [K in keyof Comments]: Comments[K] };

export const commentsCollection = createCollection(
  localOnlyCollectionOptions<CommentEntity, string>({
    id: 'comments',
    getKey: (comment) => comment.uuid,
  }),
);

export function upsertPosts(posts: readonly PostShow[]) {
  for (const post of posts) {
    const row = { ...post } as PostEntity;
    if (postsCollection.has(row.uuid)) {
      postsCollection.update(row.uuid, (draft) => {
        Object.assign(draft, row);
      });
    } else {
      postsCollection.insert(row);
    }
  }
}

export function patchPost(uuid: string, patch: Partial<PostEntity>) {
  if (!postsCollection.has(uuid)) return;
  postsCollection.update(uuid, (draft) => {
    Object.assign(draft, patch);
  });
}

export function removePost(uuid: string) {
  if (postsCollection.has(uuid)) postsCollection.delete(uuid);
}

export function upsertComments(comments: readonly Comments[]) {
  for (const comment of comments) {
    const row = { ...comment } as CommentEntity;
    if (commentsCollection.has(row.uuid)) {
      commentsCollection.update(row.uuid, (draft) => {
        Object.assign(draft, row);
      });
    } else {
      commentsCollection.insert(row);
    }
  }
}

/** Live view of one post; `fallback` renders until the row is mirrored. */
export function usePostRow(uuid: string, fallback?: PostShow): PostShow | undefined {
  const { data } = useLiveQuery((q) =>
    q.from({ post: postsCollection }).where(({ post }) => eq(post.uuid, uuid)),
  );
  return (data[0] as PostShow | undefined) ?? fallback;
}

export function useCommentRows(postId: string): CommentEntity[] {
  const { data } = useLiveQuery((q) =>
    q.from({ comment: commentsCollection }).where(({ comment }) => eq(comment.post, postId)),
  );
  return [...(data as CommentEntity[])].sort((a, b) => a.created_at.localeCompare(b.created_at));
}
