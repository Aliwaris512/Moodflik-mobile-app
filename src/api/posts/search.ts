import { type InfiniteData, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { api } from '@/api/client';
import type { PaginatedPostShowList } from '@/api/generated/types.gen';
import { upsertPosts } from '@/db/posts';

const PAGE_SIZE = 10;

/** Server-side search over post text and author name, across likes and dislikes. */
export function usePostSearch(term: string) {
  const q = term.trim();
  const query = useInfiniteQuery<
    PaginatedPostShowList,
    Error,
    InfiniteData<PaginatedPostShowList, number>,
    readonly unknown[],
    number
  >({
    queryKey: ['posts', 'search', q],
    enabled: q.length > 0,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<PaginatedPostShowList>('post/', {
        params: { type: 'all', search: q, page: pageParam, limit: PAGE_SIZE },
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
