import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';

import { useBlockUser, useMuteUser } from '@/api/users';
import { postsCollection, removePost } from '@/db/posts';

import type { PostShow } from './types';

type Snapshot = ReturnType<QueryClient['getQueriesData']>;

type Pages = { pages: { results: PostShow[] }[] };

const isPages = (v: unknown): v is Pages =>
  typeof v === 'object' && v !== null && Array.isArray((v as Pages).pages);

/** Drops every cached post by `authorId` from feeds, lists and the local DB. */
function purgeAuthor(qc: QueryClient, authorId: string) {
  for (const [uuid, row] of postsCollection.entries()) {
    if (row.posted_by === authorId) removePost(String(uuid));
  }
  qc.setQueriesData({ queryKey: ['posts'] }, (old: unknown) => {
    if (isPages(old)) {
      return {
        ...old,
        pages: old.pages.map((p) => ({
          ...p,
          results: p.results.filter((post) => post.posted_by !== authorId),
        })),
      };
    }
    if (Array.isArray(old)) {
      return (old as PostShow[]).filter((post) => post.posted_by !== authorId);
    }
    return old;
  });
}

/** Block or mute a post author, removing their posts at once and rolling back on failure. */
export function useHideAuthor(mode: 'block' | 'mute') {
  const qc = useQueryClient();
  const block = useBlockUser();
  const mute = useMuteUser();

  return useMutation({
    mutationFn: async (authorId: string) => {
      if (mode === 'block') await block.mutateAsync(authorId);
      else await mute.mutateAsync({ user_id: authorId, action: 'mute' });
    },
    onMutate: async (authorId: string) => {
      await qc.cancelQueries({ queryKey: ['posts'] });
      const snapshot: Snapshot = qc.getQueriesData({ queryKey: ['posts'] });
      purgeAuthor(qc, authorId);
      return { snapshot };
    },
    onError: (_error, _authorId, ctx) => {
      for (const [key, data] of ctx?.snapshot ?? []) qc.setQueryData(key, data);
      void qc.invalidateQueries({ queryKey: ['posts'] });
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
