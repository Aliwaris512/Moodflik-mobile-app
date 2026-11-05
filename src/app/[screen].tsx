import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppHeader,
  Avatar,
  BottomTabs,
  Button,
  Card,
  Checkbox,
  Chip,
  CommentItem,
  Composer,
  ConversationItem,
  Divider,
  Icon,
  Input,
  MenuRow,
  MessageBubble,
  MoodSelector,
  MoodToggle,
  NavRail,
  NotificationItem,
  PostCard,
  Screen,
  SearchBar,
  SectionTitle,
  StateView,
  StatTile,
  ThreadItem,
  UserListItem,
  commonStyles,
  isDislikeMood,
  type IconName,
  type MoodSide,
} from '@/components/ui';
import { colors, fonts, layout, radius, spacing, typography } from '@/constants/theme';
import { currentUser, posts, users } from '@/services/mockService';
import {
  chatService,
  commentsService,
  notificationService,
  postService,
  profileService,
  settingsService,
  threadService,
} from '@/services/repositories';
import { useAuth } from '@/context/AuthContext';
import { useResponsive } from '@/hooks/use-responsive';
import { requestPasswordReset } from '@/api/auth';
import { apiMessage } from '@/api/auth/errors';
import { useFavourites, useFeed, useMyPosts } from '@/api/posts';
import type { PaginatedPostShowList, PostShow } from '@/api/posts/types';
import { usePostRow } from '@/db/posts';
import { useAppForm } from '@/lib/form';
import { toPost } from '@/services/postMapper';
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import {
  validateDateOfBirth,
  validateEmail,
  validatePassword,
  validateStrongPassword,
} from '@/utils/validation';
import type { Comment, Message, Notification, User } from '@/types/moodflik';

const authRoutes = new Set([
  'login',
  'sign-up',
  'forgot-password',
  'reset-password',
  'otp-validation',
  'change-password',
  'profile-setup',
  'activate',
  'activate-unauthenticated-user',
  'reactivate-account',
]);
const routeAliases: Record<string, string> = {
  Login: 'login',
  SignUp: 'sign-up',
  ForgetPassword: 'forgot-password',
  ForgotPassword: 'forgot-password',
  ResetPassword: 'reset-password',
  OTPValidation: 'otp-validation',
  ChangePassword: 'change-password',
  ProfileSetup: 'profile-setup',
  Activate: 'activate',
  ActivateUnauthenticatedUser: 'activate-unauthenticated-user',
  ReactivateAccount: 'reactivate-account',
  Home: 'home',
  CreatePost: 'create-post',
  EditPost: 'edit-post',
  Favourites: 'favourites',
  Notifications: 'notifications',
  Profile: 'profile',
  UserProfile: 'user-profile',
  Search: 'search',
  DirectMessage: 'direct-message',
  Chat: 'chat',
  ProfileSetting: 'profile-setting',
  NotificationSetting: 'notification-setting',
  PrivacySetting: 'privacy-setting',
  BlockUser: 'block-user',
  Mute_Report: 'mute-report',
  Invite: 'invite',
  Help: 'help',
  AboutUs: 'about-us',
  ContactUs: 'contact',
  Cookies: 'cookies',
  TermsConditions: 'terms-conditions',
  Policy: 'policy',
  CommunityGuidelines: 'community-guidelines',
  CSAE: 'csae',
  Comments: 'comments',
  AskWhyThreads: 'ask-why-threads',
  ThreadsList: 'threads-list',
  MyPosts: 'my-posts',
  Followers: 'followers',
  Followings: 'followings',
  SinglePost: 'single-post',
  DeleteAccount: 'delete-account',
  UserToBlock: 'block-user',
  UsersList: 'search',
};
const titles: Record<string, string> = {
  home: 'Home',
  favourites: 'Favourites',
  notifications: 'Notifications',
  profile: 'Profile',
  'user-profile': 'User profile',
  followers: 'Followers',
  followings: 'Following',
  search: 'Search',
  'direct-message': 'Messages',
  chat: 'Chat',
  settings: 'Settings',
  'profile-setting': 'Edit profile',
  'notification-setting': 'Notifications',
  'privacy-setting': 'Privacy',
  'create-post': 'Create post',
  'edit-post': 'Edit post',
  comments: 'Comments',
  'ask-why-threads': 'Ask why',
  'threads-list': 'Trending moods',
  'single-post': 'Post',
  'my-posts': 'My posts',
  help: 'Help',
  'about-us': 'About Moodflik',
  contact: 'Contact us',
  cookies: 'Cookies',
  policy: 'Privacy policy',
  'terms-conditions': 'Terms & conditions',
  'community-guidelines': 'Community guidelines',
  csae: 'Safety',
  invite: 'Invite friends',
  'delete-account': 'Delete account',
  'block-user': 'Block user',
  'mute-report': 'Mute & report',
};

/* ------------------------------------------------------------------ */
/* Layout helpers                                                      */
/* ------------------------------------------------------------------ */

function Shell({
  title,
  children,
  active,
  back,
  actions = true,
  nav = true,
}: {
  title: string;
  children: React.ReactNode;
  active?: string;
  back?: boolean;
  actions?: boolean;
  nav?: boolean;
}) {
  const { rail } = useResponsive();
  const showRail = rail && nav;
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.shell}>
      <View style={styles.shellRow}>
        {showRail && <NavRail active={active} />}
        <View style={styles.shellMain}>
          <AppHeader title={title} back={back ?? !active} actions={actions} menu={!showRail} />
          {children}
        </View>
      </View>
      {active && !rail && <BottomTabs active={active} />}
    </SafeAreaView>
  );
}

/** Puts children side by side when there is room, otherwise stacks them. */
function Columns({
  enabled,
  main,
  side,
  sideWidth = 320,
}: {
  enabled: boolean;
  main: React.ReactNode;
  side: React.ReactNode;
  sideWidth?: number | `${number}%`;
}) {
  if (!enabled)
    return (
      <>
        {main}
        {side}
      </>
    );
  return (
    <View style={styles.columns}>
      <View style={styles.columnMain}>{main}</View>
      <View style={[styles.columnSide, { width: sideWidth }]}>{side}</View>
    </View>
  );
}

function PageTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.pageTitleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.pageTitle}>{title}</Text>
        {subtitle && <Text style={styles.pageSubtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

function Keyboard({ children }: { children: React.ReactNode }) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

function AuthHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.authHero}>
      <Text style={styles.authTitle}>{title}</Text>
      <Text style={styles.authSubtitle}>{subtitle}</Text>
    </View>
  );
}

const validationError = (result: ReturnType<typeof validateEmail>) =>
  result.valid ? undefined : result.message;

function Login() {
  const auth = useAuth();
  const [error, setError] = useState('');
  const form = useAppForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      try {
        setError('');
        await auth.signIn(value.email, value.password);
        router.replace('/home');
      } catch (reason: unknown) {
        setError(
          reason instanceof Error ? reason.message : 'Something went wrong. Please try again.',
        );
      }
    },
  });
  return (
    <Screen style={styles.authScreen}>
      <AuthHero title="Sign In" subtitle="Welcome back! See what everyone is feeling today." />
      <Card style={styles.authCard}>
        <form.AppField
          name="email"
          validators={{ onChange: ({ value }) => validationError(validateEmail(value)) }}
        >
          {(field) => (
            <field.TextField
              placeholder="Email address"
              icon="mail"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          )}
        </form.AppField>
        <form.AppField
          name="password"
          validators={{ onChange: ({ value }) => validationError(validatePassword(value)) }}
        >
          {(field) => (
            <field.TextField
              placeholder="Password"
              icon="lock"
              secureToggle
              autoComplete="password"
            />
          )}
        </form.AppField>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/forgot-password')}
          style={styles.forgot}
        >
          <Text style={styles.link}>Forgot Password?</Text>
        </Pressable>
        {!!error && <Text style={commonStyles.error}>{error}</Text>}
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(loading) => (
            <Button label="Login" loading={loading} onPress={() => void form.handleSubmit()} />
          )}
        </form.Subscribe>
      </Card>
      <View style={styles.orRow}>
        <Divider style={{ flex: 1 }} />
        <Text style={styles.orText}>New to Moodflik?</Text>
        <Divider style={{ flex: 1 }} />
      </View>
      <Button label="Sign Up" variant="outline" onPress={() => router.push('/sign-up')} />
    </Screen>
  );
}

const formatDob = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('/');
};

const legalLinks = [
  ['Terms and conditions', '/terms-conditions'],
  ['Policy and Data Use', '/policy'],
  ['Community guidelines', '/community-guidelines'],
  ['Cookie use', '/cookies'],
] as const;

const required = ({ value }: { value: string }) => (value.trim() ? undefined : 'Required');

function SignUp() {
  const auth = useAuth();
  const { compact } = useResponsive();
  const [agreed, setAgreed] = useState(false);
  const [formError, setFormError] = useState('');
  const form = useAppForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      confirm: '',
      dob: '',
      gender: 'Male',
    },
    onSubmit: async ({ value }) => {
      try {
        setFormError('');
        await auth.signUp(value);
        router.replace('/home');
      } catch (reason: unknown) {
        setFormError(reason instanceof Error ? reason.message : 'Unable to create your account.');
      }
    },
  });

  return (
    <Screen style={styles.authScreen}>
      <AuthHero title="Sign Up" subtitle="Create your account and start sharing your moods." />
      <Card style={styles.authCard}>
        <View style={compact ? styles.fieldGroup : styles.twoCol}>
          <View style={{ flex: 1 }}>
            <form.AppField name="firstName" validators={{ onChange: required }}>
              {(field) => <field.TextField placeholder="First Name" autoCapitalize="words" />}
            </form.AppField>
          </View>
          <View style={{ flex: 1 }}>
            <form.AppField name="lastName" validators={{ onChange: required }}>
              {(field) => <field.TextField placeholder="Last Name" autoCapitalize="words" />}
            </form.AppField>
          </View>
        </View>
        <form.AppField
          name="username"
          validators={{
            onChange: ({ value }) =>
              /^[A-Za-z0-9._]{3,}$/.test(value)
                ? undefined
                : 'At least 3 letters, numbers, dots or underscores.',
          }}
        >
          {(field) => (
            <field.TextField placeholder="Username" icon="person" autoCapitalize="none" />
          )}
        </form.AppField>
        <form.AppField
          name="email"
          validators={{ onChange: ({ value }) => validationError(validateEmail(value)) }}
        >
          {(field) => (
            <field.TextField
              placeholder="Email address"
              icon="mail"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
        </form.AppField>
        <form.AppField
          name="password"
          validators={{ onChange: ({ value }) => validationError(validateStrongPassword(value)) }}
        >
          {(field) => (
            <field.TextField
              placeholder="Password"
              icon="lock"
              secureToggle
              hint="6–16 characters including small and capital letters, number(s) and special characters."
            />
          )}
        </form.AppField>
        <form.AppField
          name="confirm"
          validators={{
            onChangeListenTo: ['password'],
            onChange: ({ value, fieldApi }) =>
              value === fieldApi.form.getFieldValue('password')
                ? undefined
                : 'Passwords do not match.',
          }}
        >
          {(field) => <field.TextField placeholder="Confirm Password" icon="lock" secureToggle />}
        </form.AppField>
        <form.AppField
          name="dob"
          validators={{ onChange: ({ value }) => validationError(validateDateOfBirth(value)) }}
        >
          {(field) => (
            <field.TextField
              placeholder="Date of Birth (DD/MM/YYYY)"
              rightIcon="calendar"
              keyboardType="number-pad"
              maxLength={10}
              format={formatDob}
              hint="You must be aged 13 or over to sign up!"
            />
          )}
        </form.AppField>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Gender</Text>
          <form.Subscribe selector={(state) => state.values.gender}>
            {(selected) => (
              <View style={styles.chipRow}>
                {['Male', 'Female', 'Other', 'Prefer not to say'].map((gender) => (
                  <Chip
                    key={gender}
                    label={gender}
                    selected={selected === gender}
                    onPress={() => form.setFieldValue('gender', gender)}
                  />
                ))}
              </View>
            )}
          </form.Subscribe>
        </View>
        <Divider />
        <Checkbox checked={agreed} onChange={setAgreed}>
          <Text style={styles.legal}>
            By ticking the box, you are agreeing with our{' '}
            {legalLinks.map(([label, path], index) => (
              <Text key={path}>
                <Text style={styles.legalLink} onPress={() => router.push(path)}>
                  {label}
                </Text>
                {index < legalLinks.length - 2
                  ? ', '
                  : index === legalLinks.length - 2
                    ? ' and '
                    : '.'}
              </Text>
            ))}
          </Text>
        </Checkbox>
        {!!formError && <Text style={commonStyles.error}>{formError}</Text>}
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(loading) => (
            <Button
              label="Agree & Create Account"
              disabled={!agreed}
              loading={loading}
              onPress={() => void form.handleSubmit()}
            />
          )}
        </form.Subscribe>
      </Card>
      <Pressable accessibilityRole="link" onPress={() => router.push('/login')}>
        <Text style={styles.centerText}>
          Already have an account? <Text style={styles.link}>Sign In</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}

type AuthMode =
  | 'forgot-password'
  | 'reset-password'
  | 'otp-validation'
  | 'change-password'
  | 'profile-setup'
  | 'activate'
  | 'activate-unauthenticated-user'
  | 'reactivate-account';

const authCopy: Record<AuthMode, { title: string; subtitle: string; action: string }> = {
  'forgot-password': {
    title: 'Forgot Password',
    subtitle: 'Enter your email and we will send you a reset link.',
    action: 'Send reset link',
  },
  'reset-password': {
    title: 'New Password',
    subtitle: 'Choose a strong password you have not used before.',
    action: 'Set new password',
  },
  'change-password': {
    title: 'Change Password',
    subtitle: 'Choose a strong password you have not used before.',
    action: 'Update password',
  },
  'otp-validation': {
    title: 'Verify Account',
    subtitle: 'Enter the 6-digit code we sent to your email.',
    action: 'Verify',
  },
  'profile-setup': {
    title: 'Your Profile',
    subtitle: 'Tell people a little about yourself.',
    action: 'Complete profile',
  },
  activate: {
    title: 'Activate Account',
    subtitle: 'Enter your email to activate your account.',
    action: 'Activate account',
  },
  'activate-unauthenticated-user': {
    title: 'Activate Account',
    subtitle: 'Enter your email to activate your account.',
    action: 'Activate account',
  },
  'reactivate-account': {
    title: 'Welcome Back',
    subtitle: 'Reactivate your account to pick up where you left off.',
    action: 'Reactivate account',
  },
};

function AuthForm({ mode }: { mode: AuthMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const copy = authCopy[mode];
  const needsEmail = [
    'forgot-password',
    'activate',
    'activate-unauthenticated-user',
    'reactivate-account',
  ].includes(mode);
  const needsPassword = mode === 'reset-password' || mode === 'change-password';
  const submit = async () => {
    try {
      setError('');
      setLoading(true);
      if (needsEmail) {
        const check = validateEmail(email);
        if (!check.valid) throw new Error(check.message);
      }
      if (needsPassword) {
        const check = validateStrongPassword(password);
        if (!check.valid) throw new Error(check.message);
      }
      if (mode === 'otp-validation' && password.length !== 6)
        throw new Error('Enter the 6-digit code.');
      if (mode === 'profile-setup' && !name.trim()) throw new Error('Please enter your name.');
      if (mode === 'forgot-password') await requestPasswordReset(email);
      router.replace(mode === 'profile-setup' ? '/home' : '/login');
    } catch (reason: unknown) {
      setError(apiMessage(reason, 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Screen style={styles.authScreen}>
      <AuthHero title={copy.title} subtitle={copy.subtitle} />
      <Card style={styles.authCard}>
        {mode === 'profile-setup' && (
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            icon="person"
            autoCapitalize="words"
          />
        )}
        {needsEmail && (
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            icon="mail"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
        {needsPassword && (
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="New password"
            icon="lock"
            secureToggle
            hint="6–16 characters including small and capital letters, number(s) and special characters."
          />
        )}
        {mode === 'otp-validation' && (
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="123456"
            keyboardType="number-pad"
            maxLength={6}
            style={styles.otp}
          />
        )}
        {!!error && <Text style={commonStyles.error}>{error}</Text>}
        <Button label={copy.action} loading={loading} onPress={() => void submit()} />
      </Card>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Feed                                                                */
/* ------------------------------------------------------------------ */

function ComposerPrompt() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Create a post"
      onPress={() => router.push('/create-post')}
      style={({ pressed }) => [styles.prompt, pressed && { opacity: 0.85 }]}
    >
      <Avatar user={currentUser} size={40} />
      <Text style={styles.promptText}>What are you loving or disliking?</Text>
      <View style={styles.promptIcon}>
        <Icon name="add" size={20} color={colors.white} />
      </View>
    </Pressable>
  );
}

type FeedKind = 'home' | 'favourites' | 'my-posts';
type FeedQuery = UseInfiniteQueryResult<InfiniteData<PaginatedPostShowList, number>, Error>;

const flatten = (query: FeedQuery) => query.data?.pages.flatMap((page) => page.results) ?? [];

function Feed({ kind = 'home' }: { kind?: FeedKind }) {
  if (kind === 'favourites') return <FavouritesFeed />;
  if (kind === 'my-posts') return <MyPostsFeed />;
  return <HomeFeed />;
}

function HomeFeed() {
  return <FeedView kind="home" love={useFeed('like')} dislike={useFeed('dislike')} />;
}

function FavouritesFeed() {
  return (
    <FeedView kind="favourites" love={useFavourites('like')} dislike={useFavourites('dislike')} />
  );
}

function MyPostsFeed() {
  return <FeedView kind="my-posts" love={useMyPosts('like')} dislike={useMyPosts('dislike')} />;
}

/** One post, read live from the TanStack DB collection so reactions update everywhere. */
function FeedItem({ post }: { post: PostShow }) {
  const row = usePostRow(post.uuid, post) ?? post;
  return (
    <PostCard post={toPost(row)} onComment={() => router.push(`/comments?postId=${post.uuid}`)} />
  );
}

function FeedView({
  kind,
  love,
  dislike,
}: {
  kind: FeedKind;
  love: FeedQuery;
  dislike: FeedQuery;
}) {
  const [side, setSide] = useState<MoodSide>('love');
  const [refreshing, setRefreshing] = useState(false);
  const r = useResponsive();

  const loveItems = flatten(love);
  const dislikeItems = flatten(dislike);
  const state =
    love.isPending || dislike.isPending
      ? 'loading'
      : love.isError || dislike.isError
        ? 'error'
        : 'ready';
  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([love.refetch(), dislike.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  const visible =
    kind === 'home'
      ? side === 'dislike'
        ? dislikeItems
        : loveItems
      : [...loveItems, ...dislikeItems].toSorted((a, b) =>
          b.created_at.localeCompare(a.created_at),
        );
  const total = loveItems.length + dislikeItems.length;
  const lovePercent = total ? Math.round((loveItems.length / total) * 100) : 50;
  const pager =
    kind === 'home'
      ? side === 'dislike'
        ? dislike
        : love
      : love.hasNextPage
        ? love
        : dislike.hasNextPage
          ? dislike
          : undefined;

  return (
    <Shell title={titles[kind]} active={kind === 'my-posts' ? undefined : kind}>
      <Screen
        refreshing={refreshing}
        onRefresh={() => void refresh()}
        style={r.sideColumn && styles.wideContent}
      >
        <Columns
          enabled={r.sideColumn}
          side={<FeedSidebar />}
          main={
            <View style={styles.stack}>
              {kind === 'home' ? (
                <>
                  <ComposerPrompt />
                  <MoodToggle value={side} onChange={setSide} />
                  <View style={styles.meter} accessibilityLabel={`${lovePercent}% loving today`}>
                    <View style={[styles.meterLove, { flex: lovePercent }]} />
                    <View style={[styles.meterDislike, { flex: 100 - lovePercent }]} />
                  </View>
                  <View style={styles.meterLegend}>
                    <Text style={[styles.meterText, { color: colors.success }]}>
                      {lovePercent}% loving
                    </Text>
                    <Text style={[styles.meterText, { color: colors.danger }]}>
                      {100 - lovePercent}% disliking
                    </Text>
                  </View>
                </>
              ) : (
                <PageTitle
                  title={titles[kind]}
                  subtitle={
                    kind === 'favourites'
                      ? 'Posts you saved for later.'
                      : 'Everything you have shared.'
                  }
                />
              )}
              {state === 'loading' ? (
                <StateView type="loading" message="Loading moods…" />
              ) : state === 'error' ? (
                <>
                  <StateView type="error" message="We could not load moods." />
                  <Button label="Try again" onPress={() => void refresh()} />
                </>
              ) : visible.length ? (
                <>
                  {visible.map((post) => (
                    <FeedItem key={post.uuid} post={post} />
                  ))}
                  {pager?.hasNextPage && (
                    <Button
                      label="Load more"
                      variant="outline"
                      loading={pager.isFetchingNextPage}
                      onPress={() => void pager.fetchNextPage()}
                    />
                  )}
                </>
              ) : (
                <StateView
                  type="empty"
                  message={
                    kind === 'my-posts'
                      ? 'You have not shared a post yet.'
                      : kind === 'favourites'
                        ? 'No favourites yet.'
                        : 'No moods here yet. Be the first!'
                  }
                />
              )}
            </View>
          }
        />
      </Screen>
    </Shell>
  );
}

function FeedSidebar() {
  return (
    <>
      <Card>
        <SectionTitle
          title="Trending moods"
          action="See all"
          onAction={() => router.push('/threads-list')}
        />
        <View style={styles.chipRow}>
          {['#loving', '#weekend', '#cricket', '#mondays', '#rain', '#coffee'].map((tag, index) => (
            <Chip
              key={tag}
              label={tag}
              icon="tag"
              tone={index % 3 === 1 ? 'danger' : index % 3 === 2 ? 'success' : 'primary'}
              onPress={() => router.push('/threads-list')}
            />
          ))}
        </View>
      </Card>
      <Card padded={false}>
        <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
          <SectionTitle title="People to follow" />
        </View>
        {users.slice(1).map((user) => (
          <UserListItem
            key={user.id}
            user={user}
            actionLabel="Follow"
            actionVariant="primary"
            onPress={() => router.push(`/user-profile?userId=${user.id}`)}
          />
        ))}
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>(users.slice(1));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const search = async (value: string) => {
    setQuery(value);
    try {
      setLoading(true);
      setError('');
      setResults(
        (await profileService.listUsers(value)).items.filter((user) => user.id !== currentUser.id),
      );
    } catch (reason: unknown) {
      console.error('Unable to search users', reason);
      setError('Search is unavailable right now.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Shell title="Search">
      <Screen>
        <SearchBar
          value={query}
          onChangeText={(value) => void search(value)}
          placeholder="Search people and moods"
          autoFocus
        />
        {!query && (
          <View style={styles.fieldGroup}>
            <SectionTitle
              title="Trending moods"
              action="See all"
              onAction={() => router.push('/threads-list')}
            />
            <View style={styles.chipRow}>
              {['#loving', '#weekend', '#cricket', '#mondays', '#rain', '#coffee'].map(
                (tag, index) => (
                  <Chip
                    key={tag}
                    label={tag}
                    icon="tag"
                    tone={index % 3 === 1 ? 'danger' : index % 3 === 2 ? 'success' : 'primary'}
                    onPress={() => router.push('/threads-list')}
                  />
                ),
              )}
            </View>
          </View>
        )}
        <SectionTitle title={query ? 'Results' : 'Suggested people'} />
        {loading ? (
          <StateView type="loading" message="Searching…" />
        ) : error ? (
          <>
            <StateView type="error" message={error} />
            <Button label="Try again" onPress={() => void search(query)} />
          </>
        ) : results.length ? (
          <Card padded={false}>
            {results.map((user, index) => (
              <View key={user.id}>
                {index > 0 && <Divider />}
                <UserListItem
                  user={user}
                  actionLabel="Follow"
                  actionVariant="primary"
                  onPress={() => router.push(`/user-profile?userId=${user.id}`)}
                />
              </View>
            ))}
          </Card>
        ) : (
          <StateView type="empty" message="No people found." />
        )}
      </Screen>
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

function AboutRow({
  icon,
  label,
  value,
  tint,
}: {
  icon: IconName;
  label: string;
  value?: string;
  tint: string;
}) {
  if (!value) return null;
  return (
    <View style={styles.aboutRow}>
      <Icon name={icon} size={18} color={tint} />
      <Text style={styles.aboutText}>
        <Text style={[styles.aboutLabel, { color: tint }]}>{label}: </Text>
        {value}
      </Text>
    </View>
  );
}

function Profile({ user = currentUser }: { user?: User }) {
  const isMe = user.id === currentUser.id;
  const r = useResponsive();
  const [following, setFollowing] = useState(!!user.isFollowing);
  const authored = posts.filter((post) => post.author.id === user.id);
  const loves = authored.filter((post) => !isDislikeMood(post.mood)).length;
  const dislikes = authored.length - loves;
  return (
    <Shell title={isMe ? 'Profile' : 'User profile'} active={isMe ? 'profile' : undefined}>
      <Screen style={r.twoPane && styles.wideContent}>
        <Columns
          enabled={r.twoPane}
          sideWidth="50%"
          main={
            <View style={styles.stack}>
              <Card padded={false}>
                <View style={styles.cover}>
                  <View style={styles.coverBlobA} />
                  <View style={styles.coverBlobB} />
                  {isMe && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Edit profile"
                      onPress={() => router.push('/profile-setting')}
                      style={styles.coverButton}
                    >
                      <Icon name="edit" size={18} color={colors.white} />
                    </Pressable>
                  )}
                </View>
                <View style={styles.profileBody}>
                  <View style={styles.avatarWrap}>
                    <Avatar user={user} size={96} ring />
                    {isMe && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Change photo"
                        onPress={() => router.push('/profile-setting')}
                        style={styles.avatarEdit}
                      >
                        <Icon name="edit" size={14} color={colors.white} />
                      </Pressable>
                    )}
                  </View>
                  <Text style={styles.profileName}>{user.displayName}</Text>
                  <Text style={styles.profileHandle}>@{user.username}</Text>
                  {!!user.bio && <Text style={styles.profileBio}>{user.bio}</Text>}
                  <View style={styles.profileActions}>
                    {isMe ? (
                      <>
                        <Button
                          label="Edit profile"
                          variant="soft"
                          icon="edit"
                          size="sm"
                          onPress={() => router.push('/profile-setting')}
                          style={{ flex: 1 }}
                        />
                        <Button
                          label="My posts"
                          variant="soft"
                          size="sm"
                          onPress={() => router.push('/my-posts')}
                          style={{ flex: 1 }}
                        />
                      </>
                    ) : (
                      <>
                        <Button
                          label={following ? 'Following' : 'Follow'}
                          variant={following ? 'soft' : 'primary'}
                          icon={following ? 'check' : 'personAdd'}
                          size="sm"
                          onPress={() => setFollowing((value) => !value)}
                          style={{ flex: 1 }}
                        />
                        <Button
                          label="Message"
                          variant="soft"
                          icon="chat"
                          size="sm"
                          onPress={() => router.push('/chat')}
                          style={{ flex: 1 }}
                        />
                      </>
                    )}
                  </View>
                  <View style={styles.statRow}>
                    <StatTile
                      value={user.followers}
                      label="Followers"
                      onPress={() => router.push('/followers')}
                    />
                    <StatTile
                      value={user.following}
                      label="Following"
                      onPress={() => router.push('/followings')}
                    />
                    <StatTile value={loves} label="Likes" tone="success" />
                    <StatTile value={dislikes} label="Dislikes" tone="danger" />
                  </View>
                </View>
              </Card>

              <Card>
                <SectionTitle title="About" />
                <AboutRow
                  icon="location"
                  label="From"
                  value={user.location}
                  tint={colors.darkText}
                />
                <AboutRow
                  icon="sparkles"
                  label="Me, in 3 words"
                  value={user.threeWords}
                  tint={colors.primary}
                />
                <AboutRow
                  icon="heart"
                  label="Things I love"
                  value={user.loves}
                  tint={colors.success}
                />
                <AboutRow
                  icon="thumbDown"
                  label="Things I dislike"
                  value={user.dislikes}
                  tint={colors.danger}
                />
              </Card>

              <SectionTitle title="Favourites" />
              <View style={styles.twoCol}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/my-posts')}
                  style={({ pressed }) => [
                    styles.bigTile,
                    { backgroundColor: colors.success },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <View style={styles.bigTileIcon}>
                    <Icon name="heart" size={20} color={colors.white} />
                  </View>
                  <Text style={styles.bigTileValue}>{loves}</Text>
                  <Text style={styles.bigTileLabel}>Things I Love</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/my-posts')}
                  style={({ pressed }) => [
                    styles.bigTile,
                    { backgroundColor: colors.danger },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <View style={styles.bigTileIcon}>
                    <Icon name="thumbDown" size={20} color={colors.white} />
                  </View>
                  <Text style={styles.bigTileValue}>{dislikes}</Text>
                  <Text style={styles.bigTileLabel}>Things I Dislike</Text>
                </Pressable>
              </View>
            </View>
          }
          side={
            <View style={styles.stack}>
              <SectionTitle title="Recent moods" />
              {authored.length ? (
                authored.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    showFollow={false}
                    onComment={() => router.push(`/comments?postId=${post.id}`)}
                  />
                ))
              ) : (
                <StateView type="empty" message="No moods shared yet." />
              )}
            </View>
          }
        />
      </Screen>
    </Shell>
  );
}

function ListPage({ type }: { type: 'followers' | 'followings' }) {
  const [query, setQuery] = useState('');
  const list = users
    .slice(1)
    .filter((user) =>
      `${user.displayName} ${user.username}`.toLowerCase().includes(query.toLowerCase()),
    );
  return (
    <Shell title={titles[type]}>
      <Screen>
        <PageTitle title={titles[type]} subtitle={`${list.length} people`} />
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={`Search ${titles[type].toLowerCase()}`}
        />
        <Card padded={false}>
          {list.map((user, index) => (
            <View key={user.id}>
              {index > 0 && <Divider />}
              <UserListItem
                user={user}
                actionLabel={type === 'followers' ? 'Remove' : 'Following'}
                onPress={() => router.push(`/user-profile?userId=${user.id}`)}
              />
            </View>
          ))}
        </Card>
      </Screen>
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/* Create post                                                         */
/* ------------------------------------------------------------------ */

function CreatePost({ edit = false }) {
  const original = posts[0];
  const [side, setSide] = useState<MoodSide>(
    edit && isDislikeMood(original.mood) ? 'dislike' : 'love',
  );
  const [mood, setMood] = useState(edit ? original.mood : '');
  const [content, setContent] = useState(edit ? original.content : '');
  const [why, setWhy] = useState(edit ? (original.why ?? '') : '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mediaUri, setMediaUri] = useState<string | undefined>();
  const tint = side === 'love' ? colors.success : colors.danger;

  const pickMedia = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Allow photo access to attach media to your post.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });
      if (!result.canceled) setMediaUri(result.assets[0].uri);
    } catch (reason: unknown) {
      console.error('Unable to pick post media', reason);
      setError('We could not open your media library.');
    }
  };
  const submit = async () => {
    try {
      setLoading(true);
      setError('');
      const media = mediaUri ? [{ uri: mediaUri, type: 'image' as const }] : undefined;
      if (edit) await postService.update(original.id, { mood, content, why, media });
      else await postService.create({ mood, content, why, media });
      router.replace('/home');
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Unable to save this post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell title={edit ? 'Edit post' : 'Create post'} actions={false}>
      <Keyboard>
        <Screen>
          <PageTitle
            title={edit ? 'Edit your mood' : 'Share your mood'}
            subtitle="Tell the community what you love or dislike."
          />
          <MoodToggle
            value={side}
            onChange={(value) => {
              setSide(value);
              setMood('');
            }}
          />
          <Card>
            <Text style={styles.fieldLabel}>How are you feeling?</Text>
            <MoodSelector value={mood} onChange={setMood} side={side} />
            {!!mood && (
              <Text style={[styles.moodPreview, { color: colors.darkText }]}>{mood}…</Text>
            )}
            <View style={[styles.contentBox, { borderColor: tint }]}>
              <Input
                value={content}
                onChangeText={setContent}
                placeholder={
                  side === 'love'
                    ? 'e.g. My brand new phone! 😍'
                    : 'e.g. The fact that it rained all day'
                }
                multiline
                numberOfLines={4}
              />
            </View>
            <Input
              label="Why? (optional)"
              value={why}
              onChangeText={setWhy}
              placeholder="Tell people why…"
              multiline
              numberOfLines={3}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => void pickMedia()}
              style={({ pressed }) => [styles.mediaPicker, pressed && { opacity: 0.8 }]}
            >
              {mediaUri ? (
                <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
              ) : (
                <>
                  <View style={styles.mediaIcon}>
                    <Icon name="photo" size={22} />
                  </View>
                  <Text style={styles.mediaText}>Add photo or video</Text>
                </>
              )}
            </Pressable>
            {mediaUri && (
              <Button label="Change media" variant="text" onPress={() => void pickMedia()} />
            )}
            {!!error && <Text style={commonStyles.error}>{error}</Text>}
            <Button
              label={edit ? 'Save changes' : 'Share mood'}
              variant={side === 'love' ? 'success' : 'danger'}
              icon="send"
              loading={loading}
              onPress={() => void submit()}
            />
          </Card>
        </Screen>
      </Keyboard>
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/* Comments                                                            */
/* ------------------------------------------------------------------ */

function Comments() {
  const { postId } = useLocalSearchParams<{ postId?: string }>();
  const post = posts.find((item) => item.id === postId) ?? posts[0];
  const [comment, setComment] = useState('');
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    commentsService
      .list(post.id)
      .then(setItems)
      .catch((reason: unknown) => console.error('Unable to load comments', reason))
      .finally(() => setLoading(false));
  }, [post.id]);
  const send = () => {
    if (!comment.trim()) return;
    setItems((current) => [
      ...current,
      {
        id: `local-${Date.now()}`,
        postId: post.id,
        author: currentUser,
        body: comment.trim(),
        createdAt: 'Just now',
      },
    ]);
    setComment('');
  };
  return (
    <Shell title="Comments" actions={false}>
      <Keyboard>
        <Screen>
          <PostCard post={post} />
          <SectionTitle title={`Comments (${items.length})`} />
          {loading ? (
            <StateView type="loading" message="Loading comments…" />
          ) : items.length ? (
            items.map((item) => <CommentItem key={item.id} comment={item} />)
          ) : (
            <StateView type="empty" message="No comments yet. Start the conversation!" />
          )}
        </Screen>
        <Composer
          value={comment}
          onChangeText={setComment}
          onSend={send}
          placeholder="Write a comment…"
        />
      </Keyboard>
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

function Notifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const load = useCallback(async () => {
    try {
      setState('loading');
      setItems(await notificationService.list());
      setState('ready');
    } catch (reason: unknown) {
      console.error('Unable to load notifications', reason);
      setState('error');
    }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);
  const fresh = items.filter((item) => !item.read);
  const earlier = items.filter((item) => item.read);
  const group = (title: string, list: Notification[]) =>
    list.length > 0 && (
      <View style={styles.fieldGroup}>
        <SectionTitle title={title} />
        <Card padded={false}>
          {list.map((item, index) => (
            <View key={item.id}>
              {index > 0 && <Divider />}
              <NotificationItem
                item={item}
                onPress={() =>
                  setItems((current) =>
                    current.map((entry) =>
                      entry.id === item.id ? { ...entry, read: true } : entry,
                    ),
                  )
                }
              />
            </View>
          ))}
        </Card>
      </View>
    );
  return (
    <Shell title="Notifications" active="notifications">
      <Screen>
        <PageTitle
          title="Notifications"
          subtitle={fresh.length ? `You have ${fresh.length} new` : 'You are all caught up'}
          right={
            fresh.length > 0 ? (
              <Button
                label="Mark all read"
                size="sm"
                variant="soft"
                onPress={() =>
                  setItems((current) => current.map((entry) => ({ ...entry, read: true })))
                }
              />
            ) : undefined
          }
        />
        {state === 'loading' ? (
          <StateView type="loading" message="Loading notifications…" />
        ) : state === 'error' ? (
          <>
            <StateView type="error" message="Notifications are unavailable." />
            <Button label="Try again" onPress={() => void load()} />
          </>
        ) : items.length ? (
          <>
            {group('New', fresh)}
            {group('Earlier', earlier)}
          </>
        ) : (
          <StateView type="empty" message="You are all caught up." />
        )}
      </Screen>
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/* Messages                                                            */
/* ------------------------------------------------------------------ */

function Inbox() {
  const [query, setQuery] = useState('');
  const [conversations, setConversations] = useState<
    Awaited<ReturnType<typeof chatService.listConversations>>
  >([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    chatService
      .listConversations()
      .then(setConversations)
      .catch((reason: unknown) => console.error('Unable to load conversations', reason))
      .finally(() => setLoading(false));
  }, []);
  const visible = conversations.filter((item) =>
    item.participant.displayName.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Shell title="Messages" actions={false}>
      <Screen>
        <PageTitle title="Messages" />
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search conversations" />
        {loading ? (
          <StateView type="loading" message="Loading conversations…" />
        ) : visible.length ? (
          <Card padded={false}>
            {visible.map((item, index) => (
              <View key={item.id}>
                {index > 0 && <Divider />}
                <ConversationItem
                  conversation={item}
                  onPress={() => router.push(`/chat?conversationId=${item.id}`)}
                />
              </View>
            ))}
          </Card>
        ) : (
          <StateView type="empty" message="Start a conversation with someone you follow." />
        )}
      </Screen>
    </Shell>
  );
}

function Chat() {
  const { conversationId = 'conversation-maya' } = useLocalSearchParams<{
    conversationId?: string;
  }>();
  const participant =
    users.find((user) => `conversation-${user.id}` === conversationId) ?? users[1];
  const r = useResponsive();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  useEffect(() => {
    chatService
      .listMessages(conversationId)
      .then(setMessages)
      .catch((reason: unknown) => console.error('Unable to load messages', reason));
  }, [conversationId]);
  const send = () => {
    if (!message.trim()) return;
    setMessages((current) => [
      ...current,
      {
        id: `local-${Date.now()}`,
        conversationId,
        senderId: currentUser.id,
        body: message.trim(),
        createdAt: 'Just now',
      },
    ]);
    setMessage('');
  };
  return (
    <Shell title="Chat" actions={false}>
      <Keyboard>
        <View style={{ paddingHorizontal: r.gutter }}>
          <View style={[styles.chatHeader, { maxWidth: r.contentMax - r.gutter * 2 }]}>
            <Avatar user={participant} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={styles.chatName}>{participant.displayName}</Text>
              <Text style={styles.chatHandle}>@{participant.username}</Text>
            </View>
          </View>
        </View>
        <Screen>
          {messages.length ? (
            messages.map((item) => (
              <MessageBubble key={item.id} message={item} mine={item.senderId === currentUser.id} />
            ))
          ) : (
            <StateView type="empty" message="Say hello 👋" />
          )}
        </Screen>
        <Composer
          value={message}
          onChangeText={setMessage}
          onSend={send}
          placeholder="Write a message…"
        />
      </Keyboard>
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/* Info, threads, menu, settings                                       */
/* ------------------------------------------------------------------ */

function Info({ title }: { title: string }) {
  const content: Record<string, string[]> = {
    Help: [
      'Find answers to common questions about sharing moods, interacting with posts, and managing your account.',
      'If you need additional help, contact the Moodflik team from the Contact us page.',
    ],
    'About Moodflik': [
      'Moodflik is a place for honest, respectful conversations. Every feeling is worth understanding and every person deserves a safe space to share.',
      'We connect people through the things they love, dislike, and want to understand better.',
    ],
    'Community guidelines': [
      'Be kind, curious, and respectful. Disagreement is welcome; harassment, hate speech, threats, and scams are not.',
      'Help keep Moodflik safe by reporting content that breaks these guidelines.',
    ],
    'Privacy policy': [
      'We use only the information needed to provide your Moodflik experience. Your account data is protected and never connected to real APIs in this mock build.',
      'You can manage profile visibility and notification preferences from Settings.',
    ],
    'Terms & conditions': [
      'By using Moodflik, you agree to participate respectfully and to keep your account information accurate.',
      'You are responsible for the content you share and for following applicable laws.',
    ],
  };
  return (
    <Shell title={title} actions={false}>
      <Screen>
        <Card>
          <View style={styles.infoIcon}>
            <Icon
              name={
                title === 'Help'
                  ? 'help'
                  : title.includes('guidelines') || title === 'Safety'
                    ? 'shield'
                    : 'info'
              }
              size={26}
            />
          </View>
          <Text style={styles.pageTitle}>{title}</Text>
          {(
            content[title] ?? [
              'Moodflik provides clear information about this service and your account.',
              'Please contact us if you have questions or need support.',
            ]
          ).map((paragraph) => (
            <Text key={paragraph} style={styles.body}>
              {paragraph}
            </Text>
          ))}
        </Card>
      </Screen>
    </Shell>
  );
}

function Threads() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof threadService.list>>>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const load = useCallback(() => {
    setState('loading');
    threadService
      .list()
      .then(setItems)
      .then(() => setState('ready'))
      .catch((reason: unknown) => {
        console.error('Unable to load threads', reason);
        setState('error');
      });
  }, []);
  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);
  return (
    <Shell title="Trending moods">
      <Screen>
        <PageTitle
          title="Trending Moods"
          subtitle="Hot topics happening locally and globally."
          right={
            <View style={styles.infoIcon}>
              <Icon name="trending" size={22} />
            </View>
          }
        />
        {state === 'loading' ? (
          <StateView type="loading" message="Loading threads…" />
        ) : state === 'error' ? (
          <>
            <StateView type="error" message="Threads are unavailable." />
            <Button label="Try again" onPress={load} />
          </>
        ) : items.length ? (
          items.map((thread) => (
            <ThreadItem
              key={thread.id}
              thread={thread}
              onPress={() => router.push(`/comments?postId=${thread.post.id}`)}
            />
          ))
        ) : (
          <StateView type="empty" message="No trending threads yet." />
        )}
      </Screen>
    </Shell>
  );
}

function MenuGroup({ rows }: { rows: readonly (readonly [IconName, string, string])[] }) {
  return (
    <Card padded={false}>
      {rows.map(([icon, label, path], index) => (
        <MenuRow
          key={path}
          icon={icon}
          label={label}
          last={index === rows.length - 1}
          onPress={() => router.push(path as never)}
        />
      ))}
    </Card>
  );
}

function Menu() {
  const auth = useAuth();
  return (
    <Shell title="Moodflik" actions={false}>
      <Screen>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/profile')}
          style={({ pressed }) => [styles.menuProfile, pressed && { opacity: 0.9 }]}
        >
          <Avatar user={currentUser} size={56} ring />
          <View style={{ flex: 1 }}>
            <Text style={styles.menuProfileName}>{currentUser.displayName}</Text>
            <Text style={styles.menuProfileHandle}>View your profile</Text>
          </View>
          <Icon name="chevronRight" size={20} color={colors.white} />
        </Pressable>
        <MenuGroup
          rows={[
            ['home', 'Home', '/home'],
            ['trending', 'Trending moods', '/threads-list'],
            ['bookmark', 'Favourites', '/favourites'],
            ['bell', 'Notifications', '/notifications'],
            ['group', 'Invite friends', '/invite'],
          ]}
        />
        <MenuGroup
          rows={[
            ['settings', 'Settings', '/settings'],
            ['help', 'Help', '/help'],
            ['info', 'About us', '/about-us'],
            ['shield', 'Community guidelines', '/community-guidelines'],
          ]}
        />
        <Card padded={false}>
          <MenuRow
            icon="logout"
            label="Sign out"
            tone="danger"
            last
            onPress={() => {
              void auth.signOut().finally(() => router.replace('/'));
            }}
          />
        </Card>
      </Screen>
    </Shell>
  );
}

function Settings() {
  return (
    <Shell title="Settings" actions={false}>
      <Screen>
        <PageTitle title="Settings" />
        <SectionTitle title="Account" />
        <MenuGroup
          rows={[
            ['person', 'Edit profile', '/profile-setting'],
            ['lock', 'Change password', '/change-password'],
            ['shield', 'Privacy', '/privacy-setting'],
            ['bell', 'Notification settings', '/notification-setting'],
          ]}
        />
        <SectionTitle title="Support" />
        <MenuGroup
          rows={[
            ['help', 'Help', '/help'],
            ['mail', 'Contact us', '/contact'],
            ['info', 'Terms & conditions', '/terms-conditions'],
          ]}
        />
        <Card padded={false}>
          <MenuRow
            icon="trash"
            label="Delete account"
            tone="danger"
            last
            onPress={() => router.push('/delete-account')}
          />
        </Card>
      </Screen>
    </Shell>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.lighterGray, true: colors.primary }}
        thumbColor={colors.white}
      />
    </View>
  );
}

function SettingsPage({ route }: { route: string }) {
  const [profile, setProfile] = useState({
    displayName: currentUser.displayName,
    bio: currentUser.bio,
    location: currentUser.location ?? '',
    threeWords: currentUser.threeWords ?? '',
    loves: currentUser.loves ?? '',
    dislikes: currentUser.dislikes ?? '',
  });
  const [toggles, setToggles] = useState({ a: true, b: true, c: false });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const isProfile = route === 'profile-setting';
  const isDelete = route === 'delete-account';
  const setField = (key: keyof typeof profile) => (value: string) =>
    setProfile((current) => ({ ...current, [key]: value }));
  const save = async () => {
    try {
      setSaving(true);
      if (isProfile)
        await settingsService.updateProfile({ displayName: profile.displayName, bio: profile.bio });
      setMessage(
        isDelete
          ? 'Your account deletion request has been recorded.'
          : 'Your settings have been saved.',
      );
    } catch (reason: unknown) {
      console.error('Unable to save settings', reason);
      setMessage('We could not save your settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  const toggleLabels =
    route === 'privacy-setting'
      ? [
          ['Private profile', 'Only approved followers can see your moods.'],
          ['Show activity status', 'Let people see when you are online.'],
          ['Allow messages from anyone', 'Otherwise only people you follow can message you.'],
        ]
      : [
          ['Push notifications', 'Reactions, comments and follows.'],
          ['Follow requests', 'When someone asks to follow you.'],
          ['Trending moods', 'A daily digest of hot topics.'],
        ];
  return (
    <Shell title={titles[route] || 'Settings'} actions={false}>
      <Keyboard>
        <Screen>
          <PageTitle title={titles[route] || 'Settings'} />
          <Card>
            {isProfile ? (
              <>
                <View style={styles.profileSetupAvatar}>
                  <Avatar user={currentUser} size={84} ring />
                  <Button
                    label="Change photo"
                    size="sm"
                    variant="soft"
                    icon="photo"
                    onPress={() => undefined}
                  />
                </View>
                <Input
                  label="Display name"
                  value={profile.displayName}
                  onChangeText={setField('displayName')}
                  icon="person"
                />
                <Input label="Bio" value={profile.bio} onChangeText={setField('bio')} multiline />
                <Input
                  label="From"
                  value={profile.location}
                  onChangeText={setField('location')}
                  icon="location"
                />
                <Input
                  label="Me, in 3 words"
                  value={profile.threeWords}
                  onChangeText={setField('threeWords')}
                  icon="sparkles"
                />
                <Input
                  label="Things I love"
                  value={profile.loves}
                  onChangeText={setField('loves')}
                  icon="heart"
                />
                <Input
                  label="Things I dislike"
                  value={profile.dislikes}
                  onChangeText={setField('dislikes')}
                  icon="thumbDown"
                />
              </>
            ) : isDelete ? (
              <>
                <View style={[styles.infoIcon, { backgroundColor: colors.dangerSoft }]}>
                  <Icon name="trash" size={24} color={colors.danger} />
                </View>
                <Text style={styles.pageTitle}>Delete your account?</Text>
                <Text style={styles.body}>
                  This action cannot be undone. Your posts and profile will be removed.
                </Text>
              </>
            ) : (
              (['a', 'b', 'c'] as const).map((key, index) => (
                <View key={key}>
                  {index > 0 && <Divider style={{ marginBottom: spacing.md }} />}
                  <ToggleRow
                    label={toggleLabels[index][0]}
                    description={toggleLabels[index][1]}
                    value={toggles[key]}
                    onChange={(value) => setToggles((current) => ({ ...current, [key]: value }))}
                  />
                </View>
              ))
            )}
            {!!message && (
              <Text style={message.startsWith('We') ? commonStyles.error : styles.success}>
                {message}
              </Text>
            )}
            <Button
              label={isDelete ? 'Confirm delete account' : 'Save changes'}
              variant={isDelete ? 'danger' : 'primary'}
              loading={saving}
              onPress={() => void save()}
            />
          </Card>
        </Screen>
      </Keyboard>
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/* Router                                                              */
/* ------------------------------------------------------------------ */

export default function DynamicScreen() {
  const { screen, userId } = useLocalSearchParams<{ screen: string; userId?: string }>();
  const rawRoute = Array.isArray(screen) ? screen[0] : screen;
  const route = routeAliases[rawRoute] ?? rawRoute;
  if (authRoutes.has(route)) {
    return (
      <Shell title="Moodflik" back actions={false} nav={false}>
        <Keyboard>
          {route === 'login' ? (
            <Login />
          ) : route === 'sign-up' ? (
            <SignUp />
          ) : (
            <AuthForm mode={route as AuthMode} />
          )}
        </Keyboard>
      </Shell>
    );
  }
  if (route === 'home') return <Feed />;
  if (route === 'favourites') return <Feed kind="favourites" />;
  if (route === 'my-posts') return <Feed kind="my-posts" />;
  if (route === 'search') return <Search />;
  if (route === 'profile') return <Profile />;
  if (route === 'user-profile')
    return <Profile user={users.find((user) => user.id === userId) ?? users[1]} />;
  if (route === 'followers' || route === 'followings') return <ListPage type={route} />;
  if (route === 'create-post' || route === 'edit-post')
    return <CreatePost edit={route === 'edit-post'} />;
  if (route === 'comments' || route === 'single-post') return <Comments />;
  if (route === 'notifications') return <Notifications />;
  if (route === 'direct-message') return <Inbox />;
  if (route === 'chat') return <Chat />;
  if (route === 'ask-why-threads' || route === 'threads-list') return <Threads />;
  if (route === 'menu') return <Menu />;
  if (route === 'settings') return <Settings />;
  if (
    ['profile-setting', 'notification-setting', 'privacy-setting', 'delete-account'].includes(route)
  )
    return <SettingsPage route={route} />;
  return <Info title={titles[route] || 'Moodflik'} />;
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.background },
  shellRow: { flex: 1, flexDirection: 'row' },
  shellMain: { flex: 1 },
  columns: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xl },
  columnMain: { flex: 1, minWidth: 0 },
  columnSide: { gap: spacing.lg },
  stack: { gap: spacing.lg },
  wideContent: { maxWidth: 1180 },
  pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pageTitle: { ...typography.h1, color: colors.darkText },
  pageSubtitle: { ...typography.body, color: colors.muted },
  body: { ...typography.body, color: colors.text },
  success: { ...typography.body, color: colors.success },
  centerText: { ...typography.body, color: colors.text, textAlign: 'center' },
  link: { fontFamily: fonts.nunitoBold, fontSize: 15, color: colors.primary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  fieldGroup: { gap: spacing.sm },
  fieldLabel: { ...typography.label, color: colors.darkText },
  twoCol: { flexDirection: 'row', gap: spacing.md },

  authScreen: { maxWidth: 480, paddingTop: spacing.xl },
  authHero: { gap: spacing.xs, marginBottom: spacing.xs },
  authTitle: { ...typography.display, color: colors.darkText },
  authSubtitle: { ...typography.body, color: colors.muted },
  authCard: { borderRadius: radius.xl, padding: spacing.xl },
  forgot: { alignSelf: 'flex-end', marginTop: -spacing.xs },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  orText: { ...typography.caption, color: colors.muted },
  legal: { ...typography.caption, fontSize: 13, color: colors.text },
  legalLink: { color: colors.primary, fontFamily: fonts.nunitoBold },
  otp: { textAlign: 'center', letterSpacing: 10, fontFamily: fonts.nunitoBold, fontSize: 24 },

  prompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    paddingLeft: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...layout.shadow,
  },
  promptText: { flex: 1, ...typography.body, color: colors.muted },
  promptIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  meter: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    gap: 3,
    marginTop: -spacing.xs,
  },
  meterLove: { backgroundColor: colors.success, borderRadius: 4 },
  meterDislike: { backgroundColor: colors.danger, borderRadius: 4 },
  meterLegend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -spacing.sm },
  meterText: { fontFamily: fonts.nunitoBold, fontSize: 12 },

  cover: { height: 120, backgroundColor: colors.primary, overflow: 'hidden' },
  coverBlobA: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primaryLight,
    opacity: 0.35,
    top: -60,
    right: -30,
  },
  coverBlobB: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.success,
    opacity: 0.25,
    bottom: -50,
    left: 20,
  },
  coverButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  profileBody: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  avatarWrap: { marginTop: -52 },
  avatarEdit: {
    position: 'absolute',
    right: 2,
    bottom: 4,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  profileName: { ...typography.h1, color: colors.darkText, marginTop: spacing.xs },
  profileHandle: { ...typography.body, color: colors.primary },
  profileBio: { ...typography.body, color: colors.muted, textAlign: 'center' },
  profileActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignSelf: 'stretch',
    marginTop: spacing.sm,
  },
  statRow: { flexDirection: 'row', gap: spacing.sm, alignSelf: 'stretch', marginTop: spacing.sm },
  aboutRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  aboutText: { flex: 1, ...typography.body, fontSize: 16, color: colors.darkText },
  aboutLabel: { fontFamily: fonts.nunitoSemiBold },
  bigTile: { flex: 1, borderRadius: radius.lg, padding: spacing.lg, gap: 2, ...layout.shadow },
  bigTileIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: spacing.sm,
  },
  bigTileValue: { fontFamily: fonts.nunitoBold, fontSize: 28, lineHeight: 34, color: colors.white },
  bigTileLabel: { fontFamily: fonts.nunitoSemiBold, fontSize: 14, color: colors.white },

  moodPreview: {
    fontFamily: fonts.nunitoMedium,
    fontStyle: 'italic',
    fontSize: 24,
    lineHeight: 32,
  },
  contentBox: { borderLeftWidth: 4, borderRadius: radius.md, paddingLeft: 2 },
  mediaPicker: {
    minHeight: 110,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primaryLight,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  mediaIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  mediaText: { fontFamily: fonts.nunitoBold, fontSize: 14, color: colors.primary },
  mediaPreview: { width: '100%', aspectRatio: 4 / 3 },

  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    alignSelf: 'center',
    width: '100%',
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...layout.shadow,
  },
  chatName: { fontFamily: fonts.nunitoBold, fontSize: 16, color: colors.darkText },
  chatHandle: { ...typography.caption, color: colors.primary },

  infoIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  menuProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    ...layout.shadowStrong,
  },
  menuProfileName: { ...typography.h2, color: colors.white },
  menuProfileHandle: { ...typography.caption, color: colors.primarySoft },
  settingRow: {
    minHeight: layout.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingLabel: { fontFamily: fonts.nunitoSemiBold, fontSize: 16, color: colors.darkText },
  settingDescription: { ...typography.caption, color: colors.muted },
  profileSetupAvatar: { alignItems: 'center', gap: spacing.sm },
});
