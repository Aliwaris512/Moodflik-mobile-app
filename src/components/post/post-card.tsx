import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';

import {
  useDeletePost,
  useReact,
  useReportPost,
  useShareCount,
  useToggleFavourite,
} from '@/api/posts';
import { getMyUserId } from '@/api/posts/me';
import { useHideAuthor } from '@/api/posts/moderation';
import type { PostShow } from '@/api/posts/types';
import { ConfirmModal } from '@/components/profile/confirm-modal';
import { usePostRow } from '@/db/posts';

import { Avatar } from './avatar';
import { compactNumber, handle, timeAgo } from './format';
import { MediaView } from './media-view';

const REPORT_REASONS = [
  'Harassment/Bullying',
  'Hate speech/Discrimination',
  'Spam/Scams',
  'Inappropriate content',
  'Other',
];

function Action({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8} className="flex-row items-center gap-1 px-2 py-1">
      <Ionicons name={icon} size={22} color={active ? '#1bdab5' : '#747a7c'} />
      {label ? <Text className="text-xs text-muted">{label}</Text> : null}
    </Pressable>
  );
}

function MenuItem({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} className="px-4 py-2">
      <Text className={danger ? 'text-danger' : 'text-ink dark:text-white'}>{label}</Text>
    </Pressable>
  );
}

export function PostCard({
  post: initial,
  linkToDetail = true,
}: {
  post: PostShow;
  linkToDetail?: boolean;
}) {
  const router = useRouter();
  const post = usePostRow(initial.uuid, initial) ?? initial;
  const { data: me } = useQuery({
    queryKey: ['me', 'id'],
    queryFn: getMyUserId,
    staleTime: Infinity,
  });
  const react = useReact();
  const favourite = useToggleFavourite();
  const deletion = useDeletePost();
  const report = useReportPost();
  const shareCount = useShareCount();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState<'block' | 'mute' | null>(null);
  const block = useHideAuthor('block');
  const mute = useHideAuthor('mute');

  const mine = me != null && me === post.posted_by;

  const onShare = async () => {
    await Share.share({
      message: `Hey, check out this mood on Moodflik https://www.moodflik.com/post/${post.uuid}`,
    });
    shareCount.mutate(post.uuid);
  };

  const confirmDelete = () => {
    setMenuOpen(false);
    Alert.alert('Delete post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletion.mutate(post.uuid) },
    ]);
  };

  const ask = (kind: 'block' | 'mute') => {
    setMenuOpen(false);
    setConfirm(kind);
  };

  const authorName = `${post.first_name ?? ''} ${post.last_name ?? ''}`.trim() || 'this user';
  const runConfirm = () => {
    const authorId = post.posted_by;
    const kind = confirm;
    setConfirm(null);
    if (!authorId || !kind) return;
    const mutation = kind === 'block' ? block : mute;
    mutation.mutate(authorId, {
      onError: () => Alert.alert('Something went wrong', 'Please try again.'),
    });
  };

  const chooseReport = () => {
    setMenuOpen(false);
    Alert.alert('Report post', 'Why are you reporting this?', [
      ...REPORT_REASONS.map((reason) => ({
        text: reason,
        onPress: () =>
          report.mutate(
            { post: post.uuid, reason },
            { onSuccess: () => Alert.alert('Thanks', 'Our Trust & Safety team will review this.') },
          ),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  return (
    <View className="border-b border-border bg-white px-4 py-4 dark:bg-neutral-950">
      <View className="flex-row items-center gap-3">
        <Avatar uri={post.photo_url} />
        <Pressable
          className="flex-1"
          onPress={() => router.push(`/user/${post.posted_by}` as Href)}
        >
          <Text className="text-base font-semibold text-ink dark:text-white">
            {post.first_name} {post.last_name}
            <Text className="font-normal text-brand-2"> {handle(post.user)}</Text>
          </Text>
          <Text className="text-xs text-muted">
            {post.mood_type ? `${post.mood_type} · ` : ''}
            {timeAgo(post.created_at)}
            {post.edited ? ' · edited' : ''}
          </Text>
        </Pressable>
        <Pressable onPress={() => setMenuOpen((v) => !v)} hitSlop={10}>
          <Ionicons name="ellipsis-vertical" size={20} color="#504f55" />
        </Pressable>
      </View>

      {menuOpen ? (
        <View className="mt-2 self-end rounded-xl border border-border bg-white p-1 dark:bg-neutral-900">
          {mine ? (
            <>
              <MenuItem
                label="Edit"
                onPress={() => {
                  setMenuOpen(false);
                  router.push(`/post/edit/${post.uuid}`);
                }}
              />
              <MenuItem label="Delete" danger onPress={confirmDelete} />
            </>
          ) : (
            <>
              <MenuItem label="Report" onPress={chooseReport} />
              <MenuItem label="Mute user" onPress={() => ask('mute')} />
              <MenuItem label="Block user" danger onPress={() => ask('block')} />
            </>
          )}
        </View>
      ) : null}

      <Pressable
        disabled={!linkToDetail}
        onPress={() => router.push(`/post/${post.uuid}`)}
        className="mt-3"
      >
        {post.content ? (
          <Text className="text-base leading-6 text-ink dark:text-white">{post.content}</Text>
        ) : null}
        <MediaView url={post.media_url} type={post.content_type} />
        {post.why_content ? (
          <Text className="mt-3 rounded-xl bg-surface p-3 text-sm italic text-muted">
            Why: {post.why_content}
          </Text>
        ) : null}
      </Pressable>

      {post.tagged_users.length > 0 ? (
        <Text className="mt-2 text-sm text-brand-2">
          {post.tagged_users
            .map((u) => handle(typeof u.username === 'string' ? u.username : ''))
            .join('  ')}
        </Text>
      ) : null}

      <View className="mt-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Action
            icon={post.is_like ? 'thumbs-up' : 'thumbs-up-outline'}
            label={post.is_like_dislike ? compactNumber(post.like_count) : undefined}
            active={post.is_like}
            onPress={() => react.mutate({ post, reaction: 'like' })}
          />
          <Action
            icon={post.is_dislike ? 'thumbs-down' : 'thumbs-down-outline'}
            label={post.is_like_dislike ? compactNumber(post.dislike_count) : undefined}
            active={post.is_dislike}
            onPress={() => react.mutate({ post, reaction: 'dislike' })}
          />
          <Action
            icon="chatbubbles-outline"
            label={compactNumber(post.comments_count)}
            onPress={() => router.push(`/comments/${post.uuid}`)}
          />
          {post.enable_ask_why ? (
            <Action
              icon="help-circle-outline"
              onPress={() => router.push(`/thread/${post.uuid}`)}
            />
          ) : null}
        </View>
        <View className="flex-row items-center">
          <Action
            icon={post.is_favourite ? 'bookmark' : 'bookmark-outline'}
            active={post.is_favourite}
            onPress={() => favourite.mutate(post)}
          />
          <Action icon="share-social-outline" onPress={() => void onShare()} />
        </View>
      </View>
      <ConfirmModal
        visible={confirm !== null}
        destructive={confirm === 'block'}
        title={confirm === 'block' ? `Block ${authorName}?` : `Mute ${authorName}?`}
        message={
          confirm === 'block'
            ? 'They will no longer see your posts and you will not see theirs.'
            : 'You will stop seeing their posts. You can unmute them in settings.'
        }
        confirmLabel={confirm === 'block' ? 'Block' : 'Mute'}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
    </View>
  );
}
