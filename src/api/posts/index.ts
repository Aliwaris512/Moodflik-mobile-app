import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect } from 'react';

import { api } from '@/api/client';
import type {
  PaginatedPostShowList,
  PostCreateRequest,
  PostShowDetails,
  ThreadCommentListResponse,
  ThreadItemResponse,
  ThreadListResponse,
} from '@/api/generated/types.gen';
import { patchPost, removePost, upsertComments, upsertPosts } from '@/db/posts';

import type { Comments, PostKind, PostShow, Reaction } from './types';

export const postKeys = {
  feed: (kind: PostKind) => ['posts', 'feed', kind] as const,
  mine: (kind: PostKind | 'all', userId?: string) =>
    ['posts', 'mine', kind, userId ?? 'me'] as const,
  favourites: (kind: PostKind) => ['posts', 'favourites', kind] as const,
  trending: ['posts', 'trending'] as const,
  detail: (id: string) => ['posts', 'detail', id] as const,
  comments: (postId: string) => ['comments', postId] as const,
  threads: (postId: string) => ['threads', postId] as const,
  threadComments: (threadId: string) => ['threads', 'comments', threadId] as const,
};

const PAGE_SIZE = 10;

type PageParam = number;

function usePagedPosts(
  queryKey: readonly unknown[],
  path: string,
  params: Record<string, string | undefined>,
) {
  const query = useInfiniteQuery<
    PaginatedPostShowList,
    Error,
    InfiniteData<PaginatedPostShowList, PageParam>,
    readonly unknown[],
    PageParam
  >({
    queryKey,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<PaginatedPostShowList>(path, {
        params: { ...params, page: pageParam, limit: PAGE_SIZE },
      });
      return data;
    },
    getNextPageParam: (last, pages) => (last.next ? pages.length + 1 : undefined),
  });

  const pages = query.data?.pages;
  useEffect(() => {
    if (pages) for (const page of pages) upsertPosts(page.results);
  }, [pages]);

  return query;
}

export const useFeed = (kind: PostKind) =>
  usePagedPosts(postKeys.feed(kind), 'post/', { type: kind });

export const useMyPosts = (kind: PostKind, userId?: string) =>
  usePagedPosts(postKeys.mine(kind, userId), 'my_posts/', { type: kind, user_id: userId });

export const useFavourites = (kind: PostKind, userId?: string) =>
  usePagedPosts(postKeys.favourites(kind), 'favourites/', { type: kind, user_id: userId });

export function useTrending() {
  return useQuery({
    queryKey: postKeys.trending,
    queryFn: async () => {
      const { data } = await api.get<PaginatedPostShowList | PostShow[]>('most_seen/');
      return Array.isArray(data) ? data : data.results;
    },
  });
}

export function usePostDetail(id: string) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<
        PostShowDetails &
          Partial<
            Pick<PostShow, 'is_like' | 'is_dislike' | 'is_favourite' | 'is_comment' | 'is_seen'>
          >
      >(`post_by_id/${id}`);
      return data;
    },
  });
}

/* ---------------------------------- mutations --------------------------------- */

function applyReaction(post: PostShow, reaction: Reaction): Partial<PostShow> {
  const likes = post.like_count ?? 0;
  const dislikes = post.dislike_count ?? 0;
  if (reaction === 'like') {
    if (post.is_like) return { is_like: false, like_count: Math.max(0, likes - 1) };
    return {
      is_like: true,
      like_count: likes + 1,
      is_dislike: false,
      dislike_count: post.is_dislike ? Math.max(0, dislikes - 1) : dislikes,
    };
  }
  if (post.is_dislike) return { is_dislike: false, dislike_count: Math.max(0, dislikes - 1) };
  return {
    is_dislike: true,
    dislike_count: dislikes + 1,
    is_like: false,
    like_count: post.is_like ? Math.max(0, likes - 1) : likes,
  };
}

/** Optimistic: patch the DB row first, roll back if the request fails. */
export function useReact() {
  return useMutation({
    mutationFn: async ({ post, reaction }: { post: PostShow; reaction: Reaction }) => {
      await api.post('reactions/', { post: post.uuid, reaction });
    },
    onMutate: ({ post, reaction }) => {
      const patch = applyReaction(post, reaction);
      patchPost(post.uuid, patch);
      return { post };
    },
    onError: (_error, _vars, ctx) => {
      if (!ctx) return;
      patchPost(ctx.post.uuid, {
        is_like: ctx.post.is_like,
        is_dislike: ctx.post.is_dislike,
        like_count: ctx.post.like_count,
        dislike_count: ctx.post.dislike_count,
      });
    },
  });
}

export function useToggleFavourite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: PostShow) => {
      await api.post('favourites/', { post: post.uuid });
    },
    onMutate: (post) => {
      const count = post.favourite_count ?? 0;
      patchPost(post.uuid, {
        is_favourite: !post.is_favourite,
        favourite_count: post.is_favourite ? Math.max(0, count - 1) : count + 1,
      });
      return { post };
    },
    onError: (_error, _post, ctx) => {
      if (ctx) {
        patchPost(ctx.post.uuid, {
          is_favourite: ctx.post.is_favourite,
          favourite_count: ctx.post.favourite_count,
        });
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['posts', 'favourites'] }),
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: PostCreateRequest) => {
      const { data } = await api.post<PostShow>('post/', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export type PostUpdateBody = Partial<
  Pick<PostShow, 'content' | 'why_content' | 'mood_type' | 'media_url' | 'content_type'>
>;

export function useUpdatePost(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: PostUpdateBody) => {
      const { data } = await api.patch<PostShow>(`post_update/${id}`, body);
      return data;
    },
    onSuccess: (data) => {
      patchPost(id, { ...body(data), edited: true });
      void qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

const body = (post: PostShow) => ({
  content: post.content,
  why_content: post.why_content,
  mood_type: post.mood_type,
  media_url: post.media_url,
  content_type: post.content_type,
});

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`post_update/${id}`);
      return id;
    },
    onSuccess: (id) => {
      removePost(id);
      void qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useReportPost() {
  return useMutation({
    mutationFn: async (vars: { post: string; reason: string; details?: string }) => {
      await api.post('post_report/', {
        post: vars.post,
        status: 'under_investigation',
        reason: vars.reason,
        ...(vars.details ? { details: vars.details } : {}),
      });
    },
  });
}

export function useShareCount() {
  return useMutation({
    mutationFn: async (post: string) => {
      await api.post('increase_share_count/', { post });
    },
  });
}

/* ---------------------------------- comments ---------------------------------- */

export function useComments(postId: string) {
  const query = useQuery({
    queryKey: postKeys.comments(postId),
    queryFn: async () => {
      const { data } = await api.get<Comments[]>(`get_post_comments/${postId}`);
      return data;
    },
  });
  const data = query.data;
  useEffect(() => {
    if (data) upsertComments(data);
  }, [data]);
  return query;
}

export function useCreateComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (comment: string) => {
      const { data } = await api.post<Comments>('comment/', { post: postId, comment });
      return data;
    },
    onSuccess: (created) => {
      upsertComments([created]);
      void qc.invalidateQueries({ queryKey: postKeys.comments(postId) });
      void qc.invalidateQueries({ queryKey: postKeys.detail(postId) });
    },
  });
}

/* ------------------------------ ask-why threads ------------------------------- */

export function useThreads(postId: string) {
  return useQuery({
    queryKey: postKeys.threads(postId),
    queryFn: async () => {
      try {
        const { data } = await api.get<ThreadListResponse>(`post_threads/${postId}`);
        return data.data ?? [];
      } catch (error) {
        // backend answers 404 when a post has no threads yet
        if (isNotFound(error)) return [];
        throw error;
      }
    },
  });
}

export function useCreateThread(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post<ThreadItemResponse>(`post_threads/${postId}`, { name });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: postKeys.threads(postId) }),
  });
}

export function useThreadComments(threadId: string) {
  return useQuery({
    queryKey: postKeys.threadComments(threadId),
    queryFn: async () => {
      try {
        const { data } = await api.get<ThreadCommentListResponse>(`threads/${threadId}/comments/`);
        return data.data ?? [];
      } catch (error) {
        if (isNotFound(error)) return [];
        throw error;
      }
    },
    refetchInterval: 8000,
  });
}

export function useCreateThreadComment(threadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (comment: string) => {
      await api.post(`threads/${threadId}/comments/`, { comment });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: postKeys.threadComments(threadId) }),
  });
}

function isNotFound(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as { response?: { status?: number } }).response?.status === 404
  );
}
