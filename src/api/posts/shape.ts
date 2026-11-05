import type { PostShowDetails } from '@/api/generated/types.gen';

import type { PostShow } from './types';

type Extra = Partial<
  Pick<PostShow, 'is_like' | 'is_dislike' | 'is_favourite' | 'is_comment' | 'is_seen'>
>;

/** post_by_id returns a slimmer shape than the feed; fill the gaps so PostCard can render it. */
export function detailToPost(detail: PostShowDetails & Extra): PostShow {
  return {
    ...detail,
    is_like: detail.is_like ?? false,
    is_dislike: detail.is_dislike ?? false,
    is_favourite: detail.is_favourite ?? false,
    is_comment: detail.is_comment ?? false,
    is_seen: detail.is_seen ?? false,
    tagged_users: [],
    mood_type: (detail as { mood_type?: string }).mood_type ?? '',
    enable_ask_why: (detail as { enable_ask_why?: boolean }).enable_ask_why ?? true,
  } as PostShow;
}
