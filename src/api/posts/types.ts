import type {
  Comments,
  PaginatedPostShowList,
  PostShow,
  ThreadCommentListResponse,
  ThreadOfPost,
} from '@/api/generated/types.gen';

export type { Comments, PaginatedPostShowList, PostShow, ThreadOfPost };
export type ThreadComment = NonNullable<ThreadCommentListResponse['data']>[number];

/** Mutable copy of a feed post; the TanStack DB collection stores these. */
export type PostEntity = { -readonly [K in keyof PostShow]: PostShow[K] };

export type PostKind = 'like' | 'dislike';
export type Reaction = 'like' | 'dislike';
