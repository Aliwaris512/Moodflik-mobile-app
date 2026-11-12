import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Image,
  Keyboard as RNKeyboard,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActionMenu,
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
  MoodSlider,
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
  type IconName,
  type MoodSide,
} from '@/components/ui';
import { colors, fonts, layout, radius, spacing, typography } from '@/constants/theme';
import {
  askWhyService,
  authService,
  chatService,
  commentsService,
  feedService,
  notificationService,
  postService,
  profileService,
  settingsService,
  threadService,
  type NotificationCategory,
  type PrivacySettings,
  type Side,
} from '@/services/repositories';
import type { PickedFile } from '@/services/api';
import { mapMessage } from '@/services/mappers';
import { openSocket, type Socket } from '@/services/realtime';
import { useAuth, useMe } from '@/context/AuthContext';
import { useResponsive } from '@/hooks/use-responsive';
import {
  validateDateOfBirth,
  validateEmail,
  validatePassword,
  validatePost,
  validateStrongPassword,
} from '@/utils/validation';
import type {
  AskThread,
  Comment,
  Conversation,
  Message,
  MessageRequest,
  Notification,
  Post,
  User,
} from '@/types/moodflik';

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
// Reachable without signing in (everything else redirects to the login screen).
const publicRoutes = new Set([
  'threads-list',
  'help',
  'about-us',
  'cookies',
  'policy',
  'terms-conditions',
  'community-guidelines',
  'csae',
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

/** Lets the user pick a photo; resolves to null when cancelled or permission is refused. */
async function pickPhoto(aspect: [number, number], purpose: string) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission required', `Allow photo access to change your ${purpose}.`);
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.8,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType };
}

function Keyboard({ children }: { children: React.ReactNode }) {
  // The screen is edge-to-edge, so the window is not resized for the keyboard and
  // KeyboardAvoidingView under-measures it; pad by the keyboard's reported height instead.
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const show = RNKeyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow',
      (event) => setHeight(event.endCoordinates.height),
    );
    const hide = RNKeyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setHeight(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return <View style={{ flex: 1, paddingBottom: height }}>{children}</View>;
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

function Login() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) return setError(emailCheck.message);
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) return setError(passwordCheck.message);
    try {
      setError('');
      setLoading(true);
      await auth.signIn(email, password);
      router.replace('/home');
    } catch (reason: unknown) {
      setError(
        reason instanceof Error ? reason.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <Screen style={styles.authScreen}>
      <AuthHero title="Sign In" subtitle="Welcome back! See what everyone is feeling today." />
      <Card style={styles.authCard}>
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          icon="mail"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          icon="lock"
          secureToggle
          autoComplete="password"
        />
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/forgot-password')}
          style={styles.forgot}
        >
          <Text style={styles.link}>Forgot Password?</Text>
        </Pressable>
        {!!error && <Text style={commonStyles.error}>{error}</Text>}
        <Button label="Login" loading={loading} onPress={() => void submit()} />
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

function SignUp() {
  const auth = useAuth();
  const { compact } = useResponsive();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirm: '',
    dob: '',
    gender: 'Male',
  });
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form | 'form', string>>>({});
  const [loading, setLoading] = useState(false);
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: key === 'dob' ? formatDob(value) : value }));

  const submit = async () => {
    const next: typeof errors = {};
    if (!form.firstName.trim()) next.firstName = 'Required';
    if (!form.lastName.trim()) next.lastName = 'Required';
    if (!/^[A-Za-z0-9._]{3,}$/.test(form.username))
      next.username = 'At least 3 letters, numbers, dots or underscores.';
    const emailCheck = validateEmail(form.email);
    if (!emailCheck.valid) next.email = emailCheck.message;
    const passwordCheck = validateStrongPassword(form.password);
    if (!passwordCheck.valid) next.password = passwordCheck.message;
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match.';
    const dobCheck = validateDateOfBirth(form.dob);
    if (!dobCheck.valid) next.dob = dobCheck.message;
    setErrors(next);
    if (Object.keys(next).length) return;
    try {
      setLoading(true);
      await auth.signUp({
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
        email: form.email,
        password: form.password,
        dob: form.dob,
        gender: form.gender,
      });
      router.replace('/home');
    } catch (reason: unknown) {
      setErrors({
        form: reason instanceof Error ? reason.message : 'Unable to create your account.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={styles.authScreen}>
      <AuthHero title="Sign Up" subtitle="Create your account and start sharing your moods." />
      <Card style={styles.authCard}>
        <View style={compact ? styles.fieldGroup : styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Input
              value={form.firstName}
              onChangeText={set('firstName')}
              placeholder="First Name"
              autoCapitalize="words"
              error={errors.firstName}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              value={form.lastName}
              onChangeText={set('lastName')}
              placeholder="Last Name"
              autoCapitalize="words"
              error={errors.lastName}
            />
          </View>
        </View>
        <Input
          value={form.username}
          onChangeText={set('username')}
          placeholder="Username"
          icon="person"
          autoCapitalize="none"
          error={errors.username}
        />
        <Input
          value={form.email}
          onChangeText={set('email')}
          placeholder="Email address"
          icon="mail"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />
        <Input
          value={form.password}
          onChangeText={set('password')}
          placeholder="Password"
          icon="lock"
          secureToggle
          error={errors.password}
          hint="6–16 characters including small and capital letters, number(s) and special characters."
        />
        <Input
          value={form.confirm}
          onChangeText={set('confirm')}
          placeholder="Confirm Password"
          icon="lock"
          secureToggle
          error={errors.confirm}
        />
        <Input
          value={form.dob}
          onChangeText={set('dob')}
          placeholder="Date of Birth (DD/MM/YYYY)"
          rightIcon="calendar"
          keyboardType="number-pad"
          maxLength={10}
          error={errors.dob}
          hint="You must be aged 13 or over to sign up!"
        />
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Gender</Text>
          <View style={styles.chipRow}>
            {['Male', 'Female', 'Other', 'Prefer not to say'].map((gender) => (
              <Chip
                key={gender}
                label={gender}
                selected={form.gender === gender}
                onPress={() => set('gender')(gender)}
              />
            ))}
          </View>
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
        {!!errors.form && <Text style={commonStyles.error}>{errors.form}</Text>}
        <Button
          label="Agree & Create Account"
          disabled={!agreed}
          loading={loading}
          onPress={() => void submit()}
        />
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
    subtitle: 'Enter your email and we will send you a 6-digit code.',
    action: 'Send code',
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
    title: 'Verify Code',
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
    subtitle: 'Enter your email and we will send you a new activation link.',
    action: 'Send activation email',
  },
  'activate-unauthenticated-user': {
    title: 'Activate Account',
    subtitle: 'Enter your email and we will send you a new activation link.',
    action: 'Send activation email',
  },
  'reactivate-account': {
    title: 'Welcome Back',
    subtitle: 'Sign in with your email and password to reactivate your account.',
    action: 'Go to sign in',
  },
};

const messageOf = (reason: unknown, fallback: string) =>
  reason instanceof Error ? reason.message : fallback;

function AuthForm({ mode }: { mode: AuthMode }) {
  const params = useLocalSearchParams<{ email?: string; code?: string }>();
  const auth = useAuth();
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const copy = authCopy[mode];
  const needsEmail =
    ['forgot-password', 'activate', 'activate-unauthenticated-user'].includes(mode) ||
    ((mode === 'otp-validation' || mode === 'reset-password') && !params.email);
  const needsPassword = mode === 'reset-password' || mode === 'change-password';
  const submit = async () => {
    try {
      setError('');
      setInfo('');
      setLoading(true);
      if (needsEmail) {
        const check = validateEmail(email);
        if (!check.valid) throw new Error(check.message);
      }
      if (needsPassword) {
        const check = validateStrongPassword(password);
        if (!check.valid) throw new Error(check.message);
        if (password !== confirm) throw new Error('Passwords do not match.');
      }
      if (mode === 'otp-validation' && password.length !== 6)
        throw new Error('Enter the 6-digit code.');
      if (mode === 'profile-setup' && !name.trim()) throw new Error('Please enter your name.');

      if (mode === 'forgot-password') {
        await authService.requestPasswordReset(email);
        router.replace(`/otp-validation?email=${encodeURIComponent(email.trim())}`);
      } else if (mode === 'otp-validation') {
        const changeCode = await authService.verifyOtp(email, password);
        router.replace(
          `/reset-password?email=${encodeURIComponent(email.trim())}&code=${changeCode}`,
        );
      } else if (mode === 'reset-password') {
        if (!params.code) throw new Error('Start again from Forgot Password to get a new code.');
        await authService.resetPassword(email, params.code, password);
        router.replace('/login');
      } else if (mode === 'change-password') {
        if (!oldPassword) throw new Error('Enter your current password.');
        await authService.changePassword(oldPassword, password);
        setInfo('Your password has been changed.');
        setOldPassword('');
        setPassword('');
        setConfirm('');
      } else if (mode === 'activate' || mode === 'activate-unauthenticated-user') {
        await authService.resendActivation(email);
        setInfo('If that account exists, an activation email is on its way.');
      } else if (mode === 'profile-setup') {
        const [firstName, ...rest] = name.trim().split(/\s+/);
        if (!auth.user) throw new Error('Please sign in first.');
        await profileService.updateProfile(auth.user.id, {
          firstName,
          lastName: rest.join(' '),
        });
        await auth.refreshUser();
        router.replace('/home');
      } else {
        router.replace('/login');
      }
    } catch (reason: unknown) {
      setError(messageOf(reason, 'Something went wrong. Please try again.'));
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
        {mode === 'change-password' && (
          <Input
            value={oldPassword}
            onChangeText={setOldPassword}
            placeholder="Current password"
            icon="lock"
            secureToggle
          />
        )}
        {needsPassword && (
          <>
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="New password"
              icon="lock"
              secureToggle
              hint="6–16 characters including small and capital letters, number(s) and special characters."
            />
            <Input
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Confirm new password"
              icon="lock"
              secureToggle
            />
          </>
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
        {!!info && <Text style={styles.success}>{info}</Text>}
        <Button label={copy.action} loading={loading} onPress={() => void submit()} />
      </Card>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

type FollowState = 'none' | 'pending' | 'approved';

const followStateOf = (user: User): FollowState =>
  user.isFollowing ? 'approved' : user.followRequest === 'pending' ? 'pending' : 'none';

/** A user row whose Follow button talks to the API (Follow → Requested → Following). */
function PersonRow({ user, hideFollow = false }: { user: User; hideFollow?: boolean }) {
  const me = useMe();
  const [state, setState] = useState<FollowState>(followStateOf(user));
  const [busy, setBusy] = useState(false);
  const isMe = user.id === me.id;
  const toggle = async () => {
    if (busy) return;
    try {
      setBusy(true);
      if (state === 'none') setState(await profileService.follow(user.id));
      else {
        await profileService.unfollow(user.id);
        setState('none');
      }
    } catch (reason: unknown) {
      console.error('Unable to update follow', reason);
      Alert.alert('Follow', messageOf(reason, 'We could not update that follow.'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <UserListItem
      user={user}
      actionLabel={
        isMe || hideFollow
          ? undefined
          : state === 'approved'
            ? 'Following'
            : state === 'pending'
              ? 'Requested'
              : 'Follow'
      }
      actionVariant={state === 'none' ? 'primary' : 'soft'}
      onAction={() => void toggle()}
      onPress={() => router.push(isMe ? '/profile' : `/user-profile?userId=${user.id}`)}
    />
  );
}

/** The most talked-about moods right now, for the "Trending" chips. */
function useTrendingMoods() {
  const [moods, setMoods] = useState<string[]>([]);
  useEffect(() => {
    threadService
      .list()
      .then((items) => {
        const counts = new Map<string, number>();
        items.forEach((item) => counts.set(item.title, (counts.get(item.title) ?? 0) + 1));
        setMoods(
          [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([mood]) => mood),
        );
      })
      .catch((reason: unknown) => console.error('Unable to load trending moods', reason));
  }, []);
  return moods;
}

function TrendingChips() {
  const moods = useTrendingMoods();
  if (!moods.length) return null;
  return (
    <View style={styles.chipRow}>
      {moods.map((mood, index) => (
        <Chip
          key={mood}
          label={mood}
          icon="tag"
          tone={index % 3 === 1 ? 'danger' : index % 3 === 2 ? 'success' : 'primary'}
          onPress={() => router.push('/threads-list')}
        />
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Feed                                                                */
/* ------------------------------------------------------------------ */

/** Shown until the user opens the activation link from the email we sent at sign-up. */
function VerifyBanner() {
  const auth = useAuth();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const unverified = !!auth.user && auth.user.isActivated === false;
  const { refreshUser } = auth;
  // The link is opened outside the app, so re-check on return and every few seconds.
  useEffect(() => {
    if (!unverified) return;
    const check = () => void refreshUser().catch(() => undefined);
    const timer = setInterval(check, 8000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [unverified, refreshUser]);
  if (!unverified) return null;
  const email = auth.session?.email ?? '';
  const run = async (work: () => Promise<string>) => {
    try {
      setBusy(true);
      setNote(await work());
    } catch (reason: unknown) {
      setNote(messageOf(reason, 'Something went wrong. Please try again.'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <Text style={styles.fieldLabel}>Verify your email</Text>
      <Text style={styles.pageSubtitle}>
        We sent an activation link to {email}. Open it, then come back here.
      </Text>
      {!!note && <Text style={styles.pageSubtitle}>{note}</Text>}
      <View style={styles.twoCol}>
        <Button
          label="Resend email"
          size="sm"
          variant="soft"
          loading={busy}
          style={{ flex: 1 }}
          onPress={() =>
            void run(async () => {
              await authService.resendActivation(email);
              return 'Activation email sent.';
            })
          }
        />
        <Button
          label="I have verified"
          size="sm"
          style={{ flex: 1 }}
          onPress={() =>
            void run(async () => {
              await auth.refreshUser();
              return 'Checked.';
            })
          }
        />
      </View>
    </Card>
  );
}

function ComposerPrompt() {
  const me = useMe();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Create a post"
      onPress={() => router.push('/create-post')}
      style={({ pressed }) => [styles.prompt, pressed && { opacity: 0.85 }]}
    >
      <Avatar user={me} size={40} />
      <Text style={styles.promptText}>What are you loving or disliking?</Text>
      <View style={styles.promptIcon}>
        <Icon name="add" size={20} color={colors.white} />
      </View>
    </Pressable>
  );
}

function Feed({ kind = 'home' }: { kind?: 'home' | 'favourites' | 'my-posts' }) {
  const me = useMe();
  const [list, setList] = useState<Post[]>([]);
  const [side, setSide] = useState<MoodSide>('love');
  const [cursors, setCursors] = useState<Record<Side, string | null>>({
    like: null,
    dislike: null,
  });
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) setRefreshing(true);
        else setState('loading');
        setError('');
        if (kind === 'favourites') {
          const [loved, disliked] = await Promise.all([
            feedService.favourites('like'),
            feedService.favourites('dislike'),
          ]);
          setList([...loved, ...disliked]);
        } else if (kind === 'my-posts') {
          setList(await feedService.byUser(me.id));
        } else {
          const [loved, disliked] = await Promise.all([
            feedService.list('like'),
            feedService.list('dislike'),
          ]);
          setList([...loved.items, ...disliked.items]);
          setCursors({ like: loved.nextCursor, dislike: disliked.nextCursor });
        }
        setState('ready');
      } catch (reason: unknown) {
        console.error('Unable to load feed', reason);
        setError(messageOf(reason, 'We could not load moods.'));
        setState('error');
      } finally {
        setRefreshing(false);
      }
    },
    [kind, me.id],
  );
  useEffect(() => {
    if (!me.id) return;
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load, me.id]);

  const feedSide: Side = side === 'dislike' ? 'dislike' : 'like';
  const loadMore = async () => {
    const cursor = cursors[feedSide];
    if (!cursor || loadingMore) return;
    try {
      setLoadingMore(true);
      const next = await feedService.list(feedSide, cursor);
      setList((current) => [...current, ...next.items]);
      setCursors((current) => ({ ...current, [feedSide]: next.nextCursor }));
    } catch (reason: unknown) {
      console.error('Unable to load more moods', reason);
      setError(messageOf(reason, 'We could not load more moods.'));
    } finally {
      setLoadingMore(false);
    }
  };

  const r = useResponsive();
  const visible = kind === 'home' ? list.filter((post) => post.type === feedSide) : list;
  const remove = (id: string) => setList((current) => current.filter((post) => post.id !== id));
  const replace = (next: Post) =>
    setList((current) => current.map((post) => (post.id === next.id ? next : post)));

  return (
    <Shell title={titles[kind]} active={kind === 'my-posts' ? undefined : kind}>
      <Screen
        refreshing={refreshing}
        onRefresh={() => void load(true)}
        style={r.sideColumn && styles.wideContent}
      >
        <Columns
          enabled={r.sideColumn}
          side={<FeedSidebar />}
          main={
            <View style={styles.stack}>
              {kind === 'home' ? (
                <>
                  <VerifyBanner />
                  <ComposerPrompt />
                  <MoodSlider value={side} onChange={setSide} />
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
                  <StateView type="error" message={error || 'We could not load moods.'} />
                  <Button label="Try again" onPress={() => void load()} />
                </>
              ) : visible.length ? (
                <>
                  {visible.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onRemoved={remove}
                      onChanged={replace}
                      onComment={() => router.push(`/comments?postId=${post.id}`)}
                    />
                  ))}
                  {kind === 'home' && !!cursors[feedSide] && (
                    <Button
                      label="Load more"
                      variant="soft"
                      loading={loadingMore}
                      onPress={() => void loadMore()}
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
  const me = useMe();
  const [people, setPeople] = useState<User[]>([]);
  useEffect(() => {
    profileService
      .listUsers('')
      .then((page) =>
        setPeople(page.items.filter((user) => user.id !== me.id && !user.isFollowing).slice(0, 4)),
      )
      .catch((reason: unknown) => console.error('Unable to load suggestions', reason));
  }, [me.id]);
  return (
    <>
      <Card>
        <SectionTitle
          title="Trending moods"
          action="See all"
          onAction={() => router.push('/threads-list')}
        />
        <TrendingChips />
      </Card>
      {people.length > 0 && (
        <Card padded={false}>
          <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
            <SectionTitle title="People to follow" />
          </View>
          {people.map((user) => (
            <PersonRow key={user.id} user={user} />
          ))}
        </Card>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

function Search() {
  const me = useMe();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const latest = useRef(0);
  const search = useCallback(
    async (value: string) => {
      const ticket = ++latest.current;
      try {
        setLoading(true);
        setError('');
        const page = await profileService.listUsers(value);
        // Ignore answers to searches the user has already typed past.
        if (ticket === latest.current) setResults(page.items.filter((user) => user.id !== me.id));
      } catch (reason: unknown) {
        console.error('Unable to search users', reason);
        if (ticket === latest.current)
          setError(messageOf(reason, 'Search is unavailable right now.'));
      } finally {
        if (ticket === latest.current) setLoading(false);
      }
    },
    [me.id],
  );
  useEffect(() => {
    const timer = setTimeout(() => void search(query), query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [query, search]);
  return (
    <Shell title="Search">
      <Screen>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search people" autoFocus />
        {!query && (
          <View style={styles.fieldGroup}>
            <SectionTitle
              title="Trending moods"
              action="See all"
              onAction={() => router.push('/threads-list')}
            />
            <TrendingChips />
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
                <PersonRow user={user} />
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

function Profile({ userId }: { userId?: string }) {
  const me = useMe();
  const auth = useAuth();
  const targetId = userId && userId !== me.id ? userId : me.id;
  const isMe = targetId === me.id;
  const r = useResponsive();
  const [user, setUser] = useState<User | null>(isMe ? auth.user : null);
  const [authored, setAuthored] = useState<Post[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [follow, setFollow] = useState<FollowState>('none');
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = useCallback(async () => {
    if (!targetId) return;
    try {
      setState('loading');
      const [profile, posts] = await Promise.all([
        profileService.getUser(targetId),
        feedService.byUser(targetId),
      ]);
      setUser(profile);
      setFollow(followStateOf(profile));
      setAuthored(posts);
      setState('ready');
    } catch (reason: unknown) {
      console.error('Unable to load profile', reason);
      setError(messageOf(reason, 'This profile is unavailable.'));
      setState('error');
    }
  }, [targetId]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const toggleFollow = async () => {
    if (!user || busy) return;
    try {
      setBusy(true);
      if (follow === 'none') setFollow(await profileService.follow(user.id));
      else {
        await profileService.unfollow(user.id);
        setFollow('none');
      }
      const lists = await profileService.followLists(user.id);
      setUser({ ...user, followers: lists.followers.length, following: lists.following.length });
    } catch (reason: unknown) {
      Alert.alert('Follow', messageOf(reason, 'We could not update that follow.'));
    } finally {
      setBusy(false);
    }
  };

  const changeCover = async () => {
    try {
      const file = await pickPhoto([16, 9], 'cover photo');
      if (!file) return;
      setBusy(true);
      const updated = await profileService.uploadCover(me.id, file);
      setUser((current) => (current ? { ...current, coverUrl: updated.coverUrl } : current));
      await auth.refreshUser();
    } catch (reason: unknown) {
      Alert.alert('Cover photo', messageOf(reason, 'We could not update your cover photo.'));
    } finally {
      setBusy(false);
    }
  };

  const title = isMe ? 'Profile' : 'User profile';
  if (!user)
    return (
      <Shell title={title} active={isMe ? 'profile' : undefined}>
        <Screen>
          {state === 'error' ? (
            <>
              <StateView type="error" message={error} />
              <Button label="Try again" onPress={() => void load()} />
            </>
          ) : (
            <StateView type="loading" message="Loading profile…" />
          )}
        </Screen>
      </Shell>
    );

  const loves = authored.filter((post) => post.type !== 'dislike').length;
  const dislikes = authored.length - loves;
  const profileQuery = isMe ? '' : `?userId=${user.id}`;
  return (
    <Shell title={title} active={isMe ? 'profile' : undefined}>
      <Screen style={r.twoPane && styles.wideContent}>
        <Columns
          enabled={r.twoPane}
          sideWidth="50%"
          main={
            <View style={styles.stack}>
              <Card padded={false}>
                <View style={styles.cover}>
                  {user.coverUrl ? (
                    <Image
                      source={{ uri: user.coverUrl }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                      accessibilityIgnoresInvertColors
                    />
                  ) : (
                    <>
                      <View style={styles.coverBlobA} />
                      <View style={styles.coverBlobB} />
                    </>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={isMe ? 'Change cover photo' : 'More options'}
                    onPress={() => (isMe ? void changeCover() : setMenuOpen(true))}
                    style={styles.coverButton}
                  >
                    <Icon name={isMe ? 'edit' : 'more'} size={18} color={colors.white} />
                  </Pressable>
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
                          label={
                            follow === 'approved'
                              ? 'Following'
                              : follow === 'pending'
                                ? 'Requested'
                                : 'Follow'
                          }
                          variant={follow === 'none' ? 'primary' : 'soft'}
                          icon={follow === 'none' ? 'personAdd' : 'check'}
                          size="sm"
                          loading={busy}
                          onPress={() => void toggleFollow()}
                          style={{ flex: 1 }}
                        />
                        <Button
                          label="Message"
                          variant="soft"
                          icon="chat"
                          size="sm"
                          onPress={() => router.push(`/chat?userId=${user.id}`)}
                          style={{ flex: 1 }}
                        />
                      </>
                    )}
                  </View>
                  <View style={styles.statRow}>
                    <StatTile
                      value={user.followers}
                      label="Followers"
                      onPress={() => router.push(`/followers${profileQuery}`)}
                    />
                    <StatTile
                      value={user.following}
                      label="Following"
                      onPress={() => router.push(`/followings${profileQuery}`)}
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
                {!user.location && !user.threeWords && !user.loves && !user.dislikes && (
                  <Text style={styles.pageSubtitle}>Nothing shared here yet.</Text>
                )}
              </Card>

              <SectionTitle title="Moods" />
              <View style={styles.twoCol}>
                <View style={[styles.bigTile, { backgroundColor: colors.success }]}>
                  <View style={styles.bigTileIcon}>
                    <Icon name="heart" size={20} color={colors.white} />
                  </View>
                  <Text style={styles.bigTileValue}>{loves}</Text>
                  <Text style={styles.bigTileLabel}>Things I Love</Text>
                </View>
                <View style={[styles.bigTile, { backgroundColor: colors.danger }]}>
                  <View style={styles.bigTileIcon}>
                    <Icon name="thumbDown" size={20} color={colors.white} />
                  </View>
                  <Text style={styles.bigTileValue}>{dislikes}</Text>
                  <Text style={styles.bigTileLabel}>Things I Dislike</Text>
                </View>
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
                    onRemoved={(id) =>
                      setAuthored((current) => current.filter((item) => item.id !== id))
                    }
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
      <ActionMenu
        visible={menuOpen}
        title={`@${user.username}`}
        onClose={() => setMenuOpen(false)}
        actions={[
          {
            label: 'Mute',
            onPress: () =>
              void profileService
                .mute(user.id)
                .then(() =>
                  Alert.alert('Muted', `You will no longer see @${user.username} in your feed.`),
                )
                .catch((reason: unknown) =>
                  Alert.alert('Mute', messageOf(reason, 'Unable to mute.')),
                ),
          },
          {
            label: 'Block',
            tone: 'danger',
            onPress: () =>
              void profileService
                .block(user.id)
                .then(() => router.back())
                .catch((reason: unknown) =>
                  Alert.alert('Block', messageOf(reason, 'Unable to block.')),
                ),
          },
        ]}
      />
    </Shell>
  );
}

function ListPage({ type }: { type: 'followers' | 'followings' }) {
  const me = useMe();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const targetId = userId || me.id;
  const mine = targetId === me.id;
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState<User[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const load = useCallback(async () => {
    if (!targetId) return;
    try {
      setState('loading');
      const lists = await profileService.followLists(targetId);
      setPeople(type === 'followers' ? lists.followers : lists.following);
      setState('ready');
    } catch (reason: unknown) {
      console.error('Unable to load people', reason);
      setState('error');
    }
  }, [targetId, type]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  const list = people.filter((user) =>
    `${user.displayName} ${user.username}`.toLowerCase().includes(query.toLowerCase()),
  );
  const drop = async (user: User) => {
    try {
      if (type === 'followers') await profileService.removeFollower(user.id);
      else await profileService.unfollow(user.id);
      setPeople((current) => current.filter((item) => item.id !== user.id));
    } catch (reason: unknown) {
      Alert.alert('Followers', messageOf(reason, 'We could not update that.'));
    }
  };
  return (
    <Shell title={titles[type]}>
      <Screen>
        <PageTitle title={titles[type]} subtitle={`${list.length} people`} />
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={`Search ${titles[type].toLowerCase()}`}
        />
        {state === 'loading' ? (
          <StateView type="loading" message="Loading…" />
        ) : state === 'error' ? (
          <>
            <StateView type="error" message="We could not load this list." />
            <Button label="Try again" onPress={() => void load()} />
          </>
        ) : list.length ? (
          <Card padded={false}>
            {list.map((user, index) => (
              <View key={user.id}>
                {index > 0 && <Divider />}
                {mine ? (
                  <UserListItem
                    user={user}
                    actionLabel={type === 'followers' ? 'Remove' : 'Unfollow'}
                    onAction={() => void drop(user)}
                    onPress={() => router.push(`/user-profile?userId=${user.id}`)}
                  />
                ) : (
                  <PersonRow user={user} />
                )}
              </View>
            ))}
          </Card>
        ) : (
          <StateView type="empty" message="Nobody here yet." />
        )}
      </Screen>
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/* Create post                                                         */
/* ------------------------------------------------------------------ */

function CreatePost({ edit = false }) {
  const { postId } = useLocalSearchParams<{ postId?: string }>();
  const [side, setSide] = useState<MoodSide>('love');
  const [mood, setMood] = useState('');
  const [content, setContent] = useState('');
  const [why, setWhy] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(edit);
  const [mediaFile, setMediaFile] = useState<PickedFile | undefined>();
  const [mediaUrl, setMediaUrl] = useState<string | undefined>();
  const [mediaIsVideo, setMediaIsVideo] = useState(false);
  const tint = side === 'love' ? colors.success : colors.danger;

  useEffect(() => {
    if (!edit || !postId) return;
    feedService
      .get(postId)
      .then((original) => {
        setSide(original.type === 'dislike' ? 'dislike' : 'love');
        setMood(original.mood);
        setContent(original.content);
        setWhy(original.why ?? '');
        setMediaUrl(original.media?.[0]?.uri);
      })
      .catch((reason: unknown) => setError(messageOf(reason, 'We could not load this post.')))
      .finally(() => setBooting(false));
  }, [edit, postId]);

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
        quality: 0.7,
      });
      if (!result.canceled) {
        setMediaFile({
          uri: result.assets[0].uri,
          fileName: result.assets[0].fileName,
          mimeType: result.assets[0].mimeType,
        });
        setMediaIsVideo(result.assets[0].type === 'video');
      }
    } catch (reason: unknown) {
      console.error('Unable to pick post media', reason);
      setError('We could not open your media library.');
    }
  };
  const submit = async () => {
    const check = validatePost(mood, content);
    if (!check.valid) return setError(check.message);
    try {
      setLoading(true);
      setError('');
      const input = {
        side: side === 'love' ? ('like' as const) : ('dislike' as const),
        mood,
        content,
        why,
        mediaFile,
        mediaUrl,
      };
      if (edit && postId) await postService.update(postId, input);
      else await postService.create(input);
      router.replace('/home');
    } catch (reason: unknown) {
      setError(messageOf(reason, 'Unable to save this post.'));
    } finally {
      setLoading(false);
    }
  };
  const preview = mediaFile?.uri ?? mediaUrl;

  return (
    <Shell title={edit ? 'Edit post' : 'Create post'} actions={false}>
      <Keyboard>
        <Screen>
          <PageTitle
            title={edit ? 'Edit your mood' : 'Share your mood'}
            subtitle="Tell the community what you love or dislike."
          />
          {booting ? (
            <StateView type="loading" message="Loading post…" />
          ) : (
            <>
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
                    maxLength={2000}
                  />
                </View>
                <Input
                  label="Why? (optional)"
                  value={why}
                  onChangeText={setWhy}
                  placeholder="Tell people why…"
                  multiline
                  numberOfLines={3}
                  maxLength={150}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void pickMedia()}
                  style={({ pressed }) => [styles.mediaPicker, pressed && { opacity: 0.8 }]}
                >
                  {preview && !mediaIsVideo ? (
                    <Image source={{ uri: preview }} style={styles.mediaPreview} />
                  ) : (
                    <>
                      <View style={styles.mediaIcon}>
                        <Icon name="photo" size={22} />
                      </View>
                      <Text style={styles.mediaText}>
                        {mediaIsVideo ? 'Video selected' : 'Add photo or video'}
                      </Text>
                    </>
                  )}
                </Pressable>
                {preview && (
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
            </>
          )}
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
  const [post, setPost] = useState<Post | null>(null);
  const [comment, setComment] = useState('');
  const [items, setItems] = useState<Comment[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const load = useCallback(async () => {
    if (!postId) return;
    try {
      setState('loading');
      const [loaded, comments] = await Promise.all([
        feedService.get(postId),
        commentsService.list(postId),
      ]);
      setPost(loaded);
      setItems(comments);
      setState('ready');
    } catch (reason: unknown) {
      console.error('Unable to load comments', reason);
      setError(messageOf(reason, 'We could not load this post.'));
      setState('error');
    }
  }, [postId]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  const send = async () => {
    if (!comment.trim() || !postId || sending) return;
    try {
      setSending(true);
      setError('');
      const created = await commentsService.create(postId, comment);
      setItems((current) => [...current, created]);
      setPost((current) => (current ? { ...current, comments: current.comments + 1 } : current));
      setComment('');
    } catch (reason: unknown) {
      setError(messageOf(reason, 'We could not post your comment.'));
    } finally {
      setSending(false);
    }
  };
  return (
    <Shell title="Comments" actions={false}>
      <Keyboard>
        <Screen>
          {state === 'loading' ? (
            <StateView type="loading" message="Loading…" />
          ) : state === 'error' && !post ? (
            <>
              <StateView type="error" message={error} />
              <Button label="Try again" onPress={() => void load()} />
            </>
          ) : (
            post && (
              <>
                <PostCard post={post} onRemoved={() => router.back()} />
                <SectionTitle title={`Comments (${items.length})`} />
                {items.length ? (
                  items.map((item) => <CommentItem key={item.id} comment={item} />)
                ) : (
                  <StateView type="empty" message="No comments yet. Start the conversation!" />
                )}
                {!!error && <Text style={commonStyles.error}>{error}</Text>}
              </>
            )
          )}
        </Screen>
        {state === 'ready' && (
          <Composer
            value={comment}
            onChangeText={setComment}
            onSend={() => void send()}
            placeholder="Write a comment…"
          />
        )}
      </Keyboard>
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/* Ask why                                                             */
/* ------------------------------------------------------------------ */

function AskWhy({ postId }: { postId: string }) {
  const [threads, setThreads] = useState<AskThread[]>([]);
  const [open, setOpen] = useState<AskThread | null>(null);
  const [answers, setAnswers] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      setState('loading');
      setThreads(await askWhyService.listThreads(postId));
      setState('ready');
    } catch (reason: unknown) {
      console.error('Unable to load questions', reason);
      setError(messageOf(reason, 'Questions are unavailable.'));
      setState('error');
    }
  }, [postId]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  const openThread = async (thread: AskThread) => {
    try {
      setError('');
      setOpen(thread);
      setAnswers(await askWhyService.listAnswers(thread.id));
    } catch (reason: unknown) {
      setError(messageOf(reason, 'We could not load the answers.'));
    }
  };
  const send = async () => {
    if (!text.trim()) return;
    try {
      setError('');
      if (open) {
        const created = await askWhyService.answer(open.id, text);
        setAnswers((current) => [...current, created]);
        setThreads((current) =>
          current.map((item) =>
            item.id === open.id ? { ...item, answers: item.answers + 1 } : item,
          ),
        );
      } else {
        const created = await askWhyService.createThread(postId, text);
        setThreads((current) => [created, ...current]);
      }
      setText('');
    } catch (reason: unknown) {
      setError(messageOf(reason, 'We could not send that.'));
    }
  };
  return (
    <Shell title="Ask why" actions={false}>
      <Keyboard>
        <Screen>
          <PageTitle
            title={open ? open.question : 'Ask why'}
            subtitle={
              open
                ? `Asked by @${open.author.username}`
                : 'Curious about this mood? Ask the author why.'
            }
            right={
              open ? (
                <Button
                  label="All questions"
                  size="sm"
                  variant="soft"
                  onPress={() => setOpen(null)}
                />
              ) : undefined
            }
          />
          {state === 'loading' ? (
            <StateView type="loading" message="Loading questions…" />
          ) : state === 'error' ? (
            <>
              <StateView type="error" message={error} />
              <Button label="Try again" onPress={() => void load()} />
            </>
          ) : open ? (
            answers.length ? (
              answers.map((item) => <CommentItem key={item.id} comment={item} />)
            ) : (
              <StateView type="empty" message="No answers yet." />
            )
          ) : threads.length ? (
            threads.map((thread) => (
              <Pressable
                key={thread.id}
                accessibilityRole="button"
                onPress={() => void openThread(thread)}
                style={({ pressed }) => [styles.questionCard, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.questionText}>{thread.question}</Text>
                <Text style={styles.pageSubtitle}>
                  @{thread.author.username} · {thread.answers}{' '}
                  {thread.answers === 1 ? 'answer' : 'answers'} · {thread.createdAt}
                </Text>
              </Pressable>
            ))
          ) : (
            <StateView type="empty" message="No questions yet. Be the first to ask!" />
          )}
          {!!error && state === 'ready' && <Text style={commonStyles.error}>{error}</Text>}
        </Screen>
        <Composer
          value={text}
          onChangeText={setText}
          onSend={() => void send()}
          placeholder={open ? 'Write an answer…' : 'Ask why…'}
        />
      </Keyboard>
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

function Notifications() {
  const auth = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const load = useCallback(async () => {
    try {
      setState('loading');
      setItems(await notificationService.list());
      // Opening the list resets the unread badge on the server.
      auth.setCounts({ notifications: 0 });
      setState('ready');
    } catch (reason: unknown) {
      console.error('Unable to load notifications', reason);
      setState('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);
  const fresh = items.filter((item) => !item.read);
  const earlier = items.filter((item) => item.read);

  const open = (item: Notification) => {
    if (!item.read) {
      setItems((current) =>
        current.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry)),
      );
      notificationService
        .markSeen(item.id)
        .catch((reason: unknown) => console.error('Unable to mark notification seen', reason));
    }
    if (item.kind === 'follow' || item.kind === 'follow-request')
      return item.actor && router.push(`/user-profile?userId=${item.actor.id}`);
    if (item.kind === 'message')
      return router.push(item.roomId ? `/chat?conversationId=${item.roomId}` : '/direct-message');
    if (item.kind === 'message-request') return router.push('/direct-message');
    if (item.postId) router.push(`/comments?postId=${item.postId}`);
  };
  const respond = async (item: Notification, accept: boolean) => {
    if (!item.requestId) return;
    try {
      await profileService.respondToRequest(item.requestId, accept);
      void auth.refreshUser();
    } catch (reason: unknown) {
      Alert.alert('Follow request', messageOf(reason, 'We could not update that request.'));
      throw reason;
    }
  };
  const markAll = () => {
    setItems((current) => current.map((entry) => ({ ...entry, read: true })));
    notificationService
      .markAllSeen()
      .catch((reason: unknown) => console.error('Unable to mark all seen', reason));
  };
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
                onPress={() => open(item)}
                onAccept={() => respond(item, true)}
                onDecline={() => respond(item, false)}
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
              <Button label="Mark all read" size="sm" variant="soft" onPress={markAll} />
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
  const me = useMe();
  const auth = useAuth();
  const [query, setQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [requests, setRequests] = useState<MessageRequest[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!me.id) return;
    try {
      const [rooms, pending, following] = await Promise.all([
        chatService.listConversations(me.id),
        chatService.listRequests(),
        chatService.friends(),
      ]);
      setConversations(rooms);
      setRequests(pending);
      setFriends(following);
      setError('');
      auth.setCounts({ messages: 0 });
    } catch (reason: unknown) {
      console.error('Unable to load conversations', reason);
      setError(messageOf(reason, 'Messages are unavailable.'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.id]);
  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 10000);
    return () => clearInterval(timer);
  }, [load]);

  const respond = async (request: MessageRequest, accept: boolean) => {
    try {
      await chatService.respondToRequest(request.roomId, accept);
      setRequests((current) => current.filter((item) => item.id !== request.id));
      if (accept) void load();
    } catch (reason: unknown) {
      Alert.alert('Message request', messageOf(reason, 'We could not update that request.'));
    }
  };
  const normalized = query.toLowerCase();
  const visible = conversations.filter((item) =>
    item.participant.displayName.toLowerCase().includes(normalized),
  );
  const talking = new Set(conversations.map((item) => item.participant.id));
  const suggestions = friends.filter(
    (user) =>
      !talking.has(user.id) &&
      `${user.displayName} ${user.username}`.toLowerCase().includes(normalized),
  );
  return (
    <Shell title="Messages" actions={false}>
      <Screen>
        <PageTitle title="Messages" />
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search conversations" />
        {loading ? (
          <StateView type="loading" message="Loading conversations…" />
        ) : (
          <>
            {!!error && <Text style={commonStyles.error}>{error}</Text>}
            {requests.length > 0 && (
              <View style={styles.fieldGroup}>
                <SectionTitle title={`Message requests (${requests.length})`} />
                <Card padded={false}>
                  {requests.map((request, index) => (
                    <View key={request.id}>
                      {index > 0 && <Divider />}
                      <View style={styles.requestRow}>
                        <Avatar user={request.sender} size={44} />
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={styles.authorLine}>{request.sender.displayName}</Text>
                          <Text style={styles.pageSubtitle} numberOfLines={2}>
                            {request.message || 'Wants to message you.'}
                          </Text>
                          <View style={styles.requestButtons}>
                            <Button
                              label="Accept"
                              size="sm"
                              onPress={() => void respond(request, true)}
                            />
                            <Button
                              label="Decline"
                              size="sm"
                              variant="soft"
                              onPress={() => void respond(request, false)}
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </Card>
              </View>
            )}
            {visible.length > 0 ? (
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
              !suggestions.length &&
              !requests.length && (
                <StateView
                  type="empty"
                  message="No conversations yet. Visit a profile and tap Message to say hello."
                />
              )
            )}
            {suggestions.length > 0 && (
              <View style={styles.fieldGroup}>
                <SectionTitle title="Start a conversation" />
                <Card padded={false}>
                  {suggestions.map((user, index) => (
                    <View key={user.id}>
                      {index > 0 && <Divider />}
                      <UserListItem
                        user={user}
                        actionLabel="Message"
                        onAction={() => router.push(`/chat?userId=${user.id}`)}
                        onPress={() => router.push(`/chat?userId=${user.id}`)}
                      />
                    </View>
                  ))}
                </Card>
              </View>
            )}
          </>
        )}
      </Screen>
    </Shell>
  );
}

const byTime = (a: Message, b: Message) => (a.sentAt ?? 0) - (b.sentAt ?? 0);

function mergeMessages(current: Message[], incoming: Message[]): Message[] {
  const known = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => known.set(message.id, message));
  return [...known.values()].sort(byTime);
}

function Chat() {
  const { conversationId, userId } = useLocalSearchParams<{
    conversationId?: string;
    userId?: string;
  }>();
  const me = useMe();
  const r = useResponsive();
  const [roomId, setRoomId] = useState<string | undefined>(conversationId);
  const [participant, setParticipant] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [sending, setSending] = useState(false);
  const socket = useRef<Socket | null>(null);

  // Work out who we are talking to (from the room list, or the profile for a brand new chat).
  useEffect(() => {
    if (!me.id) return;
    let cancelled = false;
    (async () => {
      try {
        const rooms = await chatService.listConversations(me.id);
        const room = conversationId
          ? rooms.find((item) => item.id === conversationId)
          : rooms.find((item) => item.participant.id === userId);
        if (cancelled) return;
        if (room) {
          setParticipant(room.participant);
          setRoomId(room.id);
        } else if (userId) {
          setParticipant(await profileService.getUser(userId));
        }
        if (!cancelled) setState('ready');
      } catch (reason: unknown) {
        console.error('Unable to open chat', reason);
        if (!cancelled) {
          setError(messageOf(reason, 'We could not open this chat.'));
          setState('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId, me.id, userId]);

  // Load history, listen on the live socket, and poll as a safety net.
  useEffect(() => {
    if (!roomId) return;
    const live = { active: true };
    const refresh = () =>
      chatService
        .listMessages(roomId)
        .then((list) => live.active && setMessages((current) => mergeMessages(current, list)))
        .catch((reason: unknown) => console.error('Unable to refresh messages', reason));
    void refresh();
    const timer = setInterval(() => void refresh(), 8000);
    socket.current = openSocket(`/ws/chat/${roomId}/`, (data) => {
      if (data.type === 'chat')
        setMessages((current) =>
          mergeMessages(current, [
            mapMessage(
              {
                uuid: String(data.uuid),
                message: String(data.message),
                datetime: String(data.datetime),
                user: String(data.user),
              },
              roomId,
            ),
          ]),
        );
    });
    return () => {
      live.active = false;
      clearInterval(timer);
      socket.current?.close();
      socket.current = null;
    };
  }, [roomId]);

  const send = async () => {
    const text = message.trim();
    if (!text || sending || !participant) return;
    try {
      setSending(true);
      setError('');
      setInfo('');
      if (roomId && socket.current?.send({ message: text })) {
        setMessage('');
      } else if (roomId || participant.isFollowing) {
        const sent = await chatService.send(participant.id, text, roomId);
        setRoomId(sent.roomId);
        setMessages((current) => mergeMessages(current, [sent.message]));
        setMessage('');
      } else {
        // People you do not follow receive a message request first.
        await chatService.sendRequest(participant.id, text);
        setInfo(`Message request sent to @${participant.username}. You can chat once they accept.`);
        setMessage('');
      }
    } catch (reason: unknown) {
      setError(messageOf(reason, 'We could not send your message.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Shell title="Chat" actions={false}>
      <Keyboard>
        {participant && (
          <View style={{ paddingHorizontal: r.gutter }}>
            <View style={[styles.chatHeader, { maxWidth: r.contentMax - r.gutter * 2 }]}>
              <Avatar user={participant} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={styles.chatName}>{participant.displayName}</Text>
                <Text style={styles.chatHandle}>@{participant.username}</Text>
              </View>
            </View>
          </View>
        )}
        <Screen>
          {state === 'loading' ? (
            <StateView type="loading" message="Opening chat…" />
          ) : state === 'error' ? (
            <StateView type="error" message={error} />
          ) : messages.length ? (
            messages.map((item) => (
              <MessageBubble key={item.id} message={item} mine={item.senderId === me.id} />
            ))
          ) : (
            <StateView type="empty" message="Say hello 👋" />
          )}
          {!!info && <Text style={styles.success}>{info}</Text>}
          {!!error && state === 'ready' && <Text style={commonStyles.error}>{error}</Text>}
        </Screen>
        {state === 'ready' && (
          <Composer
            value={message}
            onChangeText={setMessage}
            onSend={() => void send()}
            placeholder="Write a message…"
          />
        )}
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
      'We use only the information needed to provide your Moodflik experience. Your account data is protected and is never sold.',
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

function Contact() {
  const me = useMe();
  const auth = useAuth();
  const [name, setName] = useState(me.displayName);
  const [email, setEmail] = useState(auth.session?.email ?? '');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    const check = validateEmail(email);
    if (!check.valid) return setError(check.message);
    if (!name.trim() || !text.trim()) return setError('Please fill in your name and message.');
    try {
      setLoading(true);
      setError('');
      await settingsService.contact(name.trim(), email.trim(), text.trim());
      setDone('Thanks! Your message has been sent to the Moodflik team.');
      setText('');
    } catch (reason: unknown) {
      setError(messageOf(reason, 'We could not send your message.'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Shell title="Contact us" actions={false}>
      <Keyboard>
        <Screen>
          <PageTitle title="Contact us" subtitle="We usually reply within a couple of days." />
          <Card>
            <Input label="Name" value={name} onChangeText={setName} icon="person" />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              icon="mail"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Message"
              value={text}
              onChangeText={setText}
              multiline
              numberOfLines={5}
            />
            {!!error && <Text style={commonStyles.error}>{error}</Text>}
            {!!done && <Text style={styles.success}>{done}</Text>}
            <Button label="Send message" loading={loading} onPress={() => void submit()} />
          </Card>
        </Screen>
      </Keyboard>
    </Shell>
  );
}

function Invite() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    const check = validateEmail(email);
    if (!check.valid) return setError(check.message);
    try {
      setLoading(true);
      setError('');
      setDone('');
      await settingsService.invite(email);
      setDone(`Invitation sent to ${email.trim()}.`);
      setEmail('');
    } catch (reason: unknown) {
      setError(messageOf(reason, 'We could not send the invitation.'));
    } finally {
      setLoading(false);
    }
  };
  const shareInvite = async () => {
    try {
      await Share.share({
        message:
          'Come share your moods with me on Moodflik — what you love, what you can’t stand, and why. https://www.moodflik.com/',
      });
    } catch (reason: unknown) {
      setError(messageOf(reason, 'We could not open sharing.'));
    }
  };
  return (
    <Shell title="Invite friends" actions={false}>
      <Keyboard>
        <Screen>
          <Text style={styles.inviteTitle}>Share the joy of Moodflik.</Text>
          <Text style={styles.inviteBody}>
            Life’s too good (and too frustrating) to keep your moods to yourself! ❤️ Invite your
            friends to join Moodflik and let them share what they love, what they can’t stand, and
            why—all in one colourful, fun community. Send an invite via SMS, social media, or email
            ✉️ and make every mood count together!
          </Text>
          <Button
            label="Send invite via SMS/Social media"
            icon="send"
            onPress={() => void shareInvite()}
          />
          <Card>
            <Input
              placeholder="Enter E-mail address"
              accessibilityLabel="Enter E-mail address"
              value={email}
              onChangeText={setEmail}
              icon="mail"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {!!error && <Text style={commonStyles.error}>{error}</Text>}
            {!!done && <Text style={styles.success}>{done}</Text>}
            <Button label="Send invite" loading={loading} onPress={() => void submit()} />
          </Card>
        </Screen>
      </Keyboard>
    </Shell>
  );
}

/** Blocked or muted accounts, with a button to reverse it. */
function RestrictedUsers({ kind }: { kind: 'blocked' | 'muted' }) {
  const [people, setPeople] = useState<User[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const load = useCallback(async () => {
    try {
      setState('loading');
      setPeople(
        kind === 'blocked' ? await profileService.listBlocked() : await profileService.listMuted(),
      );
      setState('ready');
    } catch (reason: unknown) {
      console.error('Unable to load list', reason);
      setState('error');
    }
  }, [kind]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  const undo = async (user: User) => {
    try {
      if (kind === 'blocked') await profileService.unblock(user.id);
      else await profileService.mute(user.id, false);
      setPeople((current) => current.filter((item) => item.id !== user.id));
    } catch (reason: unknown) {
      Alert.alert('Moodflik', messageOf(reason, 'We could not update that.'));
    }
  };
  return (
    <Shell title={titles[kind === 'blocked' ? 'block-user' : 'mute-report']} actions={false}>
      <Screen>
        <PageTitle
          title={kind === 'blocked' ? 'Blocked users' : 'Muted accounts'}
          subtitle={
            kind === 'blocked'
              ? 'Blocked people cannot see your posts or message you.'
              : 'Muted accounts stay out of your feed.'
          }
        />
        {state === 'loading' ? (
          <StateView type="loading" message="Loading…" />
        ) : state === 'error' ? (
          <>
            <StateView type="error" message="We could not load this list." />
            <Button label="Try again" onPress={() => void load()} />
          </>
        ) : people.length ? (
          <Card padded={false}>
            {people.map((user, index) => (
              <View key={user.id}>
                {index > 0 && <Divider />}
                <UserListItem
                  user={user}
                  actionLabel={kind === 'blocked' ? 'Unblock' : 'Unmute'}
                  onAction={() => void undo(user)}
                />
              </View>
            ))}
          </Card>
        ) : (
          <StateView
            type="empty"
            message={
              kind === 'blocked' ? 'You have not blocked anyone.' : 'You have not muted anyone.'
            }
          />
        )}
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
  const me = useMe();
  return (
    <Shell title="Moodflik" actions={false}>
      <Screen>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/profile')}
          style={({ pressed }) => [styles.menuProfile, pressed && { opacity: 0.9 }]}
        >
          <Avatar user={me} size={56} ring />
          <View style={{ flex: 1 }}>
            <Text style={styles.menuProfileName}>{me.displayName}</Text>
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
        <SectionTitle title="Safety" />
        <MenuGroup
          rows={[
            ['group', 'Blocked users', '/block-user'],
            ['mood', 'Muted accounts', '/mute-report'],
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

function ProfileSettings() {
  const auth = useAuth();
  const me = useMe();
  const [profile, setProfile] = useState({
    displayName: me.displayName,
    bio: me.bio,
    location: me.location ?? '',
    threeWords: me.threeWords ?? '',
    loves: me.loves ?? '',
    dislikes: me.dislikes ?? '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  // The profile finishes loading after the screen mounts; fill the form once when it does.
  const filled = useRef(!!auth.user?.firstName);
  useEffect(() => {
    if (filled.current || !auth.user?.firstName) return;
    filled.current = true;
    setProfile({
      displayName: auth.user.displayName,
      bio: auth.user.bio,
      location: auth.user.location ?? '',
      threeWords: auth.user.threeWords ?? '',
      loves: auth.user.loves ?? '',
      dislikes: auth.user.dislikes ?? '',
    });
  }, [auth.user]);
  const setField = (key: keyof typeof profile) => (value: string) =>
    setProfile((current) => ({ ...current, [key]: value }));

  const changePhoto = async () => {
    try {
      const file = await pickPhoto([1, 1], 'profile photo');
      if (!file) return;
      setUploading(true);
      setError('');
      await profileService.uploadAvatar(me.id, file);
      await auth.refreshUser();
      setMessage('Your photo has been updated.');
    } catch (reason: unknown) {
      setError(messageOf(reason, 'We could not update your photo.'));
    } finally {
      setUploading(false);
    }
  };
  const changeCover = async () => {
    try {
      const file = await pickPhoto([16, 9], 'cover photo');
      if (!file) return;
      setUploadingCover(true);
      setError('');
      await profileService.uploadCover(me.id, file);
      await auth.refreshUser();
      setMessage('Your cover photo has been updated.');
    } catch (reason: unknown) {
      setError(messageOf(reason, 'We could not update your cover photo.'));
    } finally {
      setUploadingCover(false);
    }
  };
  const save = async () => {
    const [firstName, ...rest] = profile.displayName.trim().split(/\s+/);
    if (!firstName) return setError('Please enter your name.');
    try {
      setSaving(true);
      setError('');
      setMessage('');
      await profileService.updateProfile(me.id, {
        firstName,
        lastName: rest.join(' '),
        bio: profile.bio,
        city: profile.location,
        threeWords: profile.threeWords,
        loves: profile.loves,
        dislikes: profile.dislikes,
      });
      await auth.refreshUser();
      setMessage('Your profile has been saved.');
    } catch (reason: unknown) {
      setError(messageOf(reason, 'We could not save your profile.'));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Card>
      <View style={styles.profileSetupAvatar}>
        <Avatar user={me} size={84} ring />
        <Button
          label="Change photo"
          size="sm"
          variant="soft"
          icon="photo"
          loading={uploading}
          onPress={() => void changePhoto()}
        />
      </View>
      <Button
        label="Change cover photo"
        size="sm"
        variant="soft"
        icon="photo"
        loading={uploadingCover}
        onPress={() => void changeCover()}
      />
      <Input
        label="Display name"
        value={profile.displayName}
        onChangeText={setField('displayName')}
        icon="person"
      />
      <Input
        label="Bio"
        value={profile.bio}
        onChangeText={setField('bio')}
        multiline
        maxLength={300}
      />
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
        maxLength={30}
      />
      <Input
        label="Things I love"
        value={profile.loves}
        onChangeText={setField('loves')}
        icon="heart"
        maxLength={50}
      />
      <Input
        label="Things I dislike"
        value={profile.dislikes}
        onChangeText={setField('dislikes')}
        icon="thumbDown"
        maxLength={50}
      />
      {!!error && <Text style={commonStyles.error}>{error}</Text>}
      {!!message && <Text style={styles.success}>{message}</Text>}
      <Button label="Save changes" loading={saving} onPress={() => void save()} />
    </Card>
  );
}

const privacyRows: {
  key: keyof PrivacySettings;
  label: string;
  description: string;
}[] = [
  {
    key: 'privateProfile',
    label: 'Private profile',
    description: 'Only people you approve can see your moods.',
  },
  {
    key: 'showOnlineStatus',
    label: 'Show activity status',
    description: 'Let people see when you are online.',
  },
  {
    key: 'allowMessageRequests',
    label: 'Allow message requests',
    description: 'Let people you do not follow send you a message request.',
  },
  {
    key: 'searchable',
    label: 'Appear in search',
    description: 'Let people find you by name or username.',
  },
  {
    key: 'allowComments',
    label: 'Allow comments',
    description: 'Let people comment on your moods.',
  },
  {
    key: 'showMoodHistory',
    label: 'Show mood history',
    description: 'Let people browse your earlier moods.',
  },
];

function PrivacySettingsPage() {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    settingsService
      .getPrivacy()
      .then(setSettings)
      .catch((reason: unknown) => setError(messageOf(reason, 'We could not load your settings.')));
  }, []);
  const change = async (key: keyof PrivacySettings, value: boolean) => {
    if (!settings) return;
    const previous = settings;
    const next = { ...settings, [key]: value };
    setSettings(next);
    try {
      setError('');
      await settingsService.savePrivacy(next);
    } catch (reason: unknown) {
      setSettings(previous);
      setError(messageOf(reason, 'We could not save that setting.'));
    }
  };
  return (
    <Card>
      {!settings && !error && <StateView type="loading" message="Loading settings…" />}
      {settings &&
        privacyRows.map((row, index) => (
          <View key={row.key}>
            {index > 0 && <Divider style={{ marginBottom: spacing.md }} />}
            <ToggleRow
              label={row.label}
              description={row.description}
              value={settings[row.key]}
              onChange={(value) => void change(row.key, value)}
            />
          </View>
        ))}
      {!!error && <Text style={commonStyles.error}>{error}</Text>}
    </Card>
  );
}

function NotificationSettingsPage() {
  const [categories, setCategories] = useState<NotificationCategory[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    settingsService
      .getNotificationSettings()
      .then(setCategories)
      .catch((reason: unknown) => setError(messageOf(reason, 'We could not load your settings.')));
  }, []);
  const change = async (category: string, option: string, value: boolean) => {
    const previous = categories;
    setCategories((current) =>
      current
        ? current.map((item) =>
            item.key === category
              ? {
                  ...item,
                  options: item.options.map((entry) =>
                    entry.key === option ? { ...entry, value } : entry,
                  ),
                }
              : item,
          )
        : current,
    );
    try {
      setError('');
      await settingsService.setNotificationOption(category, option, value);
    } catch (reason: unknown) {
      setCategories(previous);
      setError(messageOf(reason, 'We could not save that setting.'));
    }
  };
  return (
    <>
      {!categories && !error && <StateView type="loading" message="Loading settings…" />}
      {categories?.map((category) => (
        <View key={category.key} style={styles.fieldGroup}>
          <SectionTitle title={category.label} />
          <Card>
            {category.options.map((option, index) => (
              <View key={option.key}>
                {index > 0 && <Divider style={{ marginBottom: spacing.md }} />}
                <ToggleRow
                  label={option.label}
                  value={option.value}
                  onChange={(value) => void change(category.key, option.key, value)}
                />
              </View>
            ))}
          </Card>
        </View>
      ))}
      {!!error && <Text style={commonStyles.error}>{error}</Text>}
    </>
  );
}

function DeleteAccount() {
  const auth = useAuth();
  const me = useMe();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'delete' | 'deactivate' | null>(null);
  const [confirming, setConfirming] = useState(false);
  const run = async (action: 'delete' | 'deactivate') => {
    if (action === 'delete' && !reason.trim())
      return setError('Please tell us why you are leaving.');
    try {
      setBusy(action);
      setError('');
      await authService.closeAccount(me.id, action, reason.trim() || 'Not provided');
      await auth.signOut();
      router.replace('/');
    } catch (failure: unknown) {
      setError(messageOf(failure, 'We could not update your account.'));
    } finally {
      setBusy(null);
      setConfirming(false);
    }
  };
  return (
    <Card>
      <View style={[styles.infoIcon, { backgroundColor: colors.dangerSoft }]}>
        <Icon name="trash" size={24} color={colors.danger} />
      </View>
      <Text style={styles.pageTitle}>Delete your account?</Text>
      <Text style={styles.body}>
        Deleting removes your profile and you will no longer be able to sign in. Not sure? You can
        deactivate instead and come back any time by signing in.
      </Text>
      <Input
        label="Why are you leaving?"
        value={reason}
        onChangeText={setReason}
        multiline
        numberOfLines={3}
      />
      {!!error && <Text style={commonStyles.error}>{error}</Text>}
      <Button
        label="Deactivate instead"
        variant="soft"
        loading={busy === 'deactivate'}
        onPress={() => void run('deactivate')}
      />
      {confirming ? (
        <Button
          label="Yes, permanently delete my account"
          variant="danger"
          loading={busy === 'delete'}
          onPress={() => void run('delete')}
        />
      ) : (
        <Button label="Delete account" variant="danger" onPress={() => setConfirming(true)} />
      )}
    </Card>
  );
}

function SettingsPage({ route }: { route: string }) {
  return (
    <Shell title={titles[route] || 'Settings'} actions={false}>
      <Keyboard>
        <Screen>
          <PageTitle title={titles[route] || 'Settings'} />
          {route === 'profile-setting' ? (
            <ProfileSettings />
          ) : route === 'delete-account' ? (
            <DeleteAccount />
          ) : route === 'privacy-setting' ? (
            <PrivacySettingsPage />
          ) : (
            <NotificationSettingsPage />
          )}
        </Screen>
      </Keyboard>
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/* Router                                                              */
/* ------------------------------------------------------------------ */

export default function DynamicScreen() {
  const { screen, userId, postId } = useLocalSearchParams<{
    screen: string;
    userId?: string;
    postId?: string;
  }>();
  const auth = useAuth();
  const rawRoute = Array.isArray(screen) ? screen[0] : screen;
  const route = routeAliases[rawRoute] ?? rawRoute;
  const isPublic = authRoutes.has(route) || publicRoutes.has(route);

  useEffect(() => {
    if (!isPublic && auth.status === 'signedOut') router.replace('/login');
  }, [auth.status, isPublic]);

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
  if (!isPublic && auth.status !== 'signedIn')
    return (
      <Shell title="Moodflik" actions={false} nav={false}>
        <StateView type="loading" message="Loading…" />
      </Shell>
    );

  if (route === 'home') return <Feed />;
  if (route === 'favourites') return <Feed kind="favourites" />;
  if (route === 'my-posts') return <Feed kind="my-posts" />;
  if (route === 'search') return <Search />;
  if (route === 'profile') return <Profile />;
  if (route === 'user-profile') return <Profile key={userId} userId={userId} />;
  if (route === 'followers' || route === 'followings') return <ListPage type={route} />;
  if (route === 'create-post' || route === 'edit-post')
    return <CreatePost edit={route === 'edit-post'} />;
  if (route === 'comments' || route === 'single-post') return <Comments />;
  if (route === 'notifications') return <Notifications />;
  if (route === 'direct-message') return <Inbox />;
  if (route === 'chat') return <Chat />;
  if (route === 'ask-why-threads' && postId) return <AskWhy postId={postId} />;
  if (route === 'ask-why-threads' || route === 'threads-list') return <Threads />;
  if (route === 'menu') return <Menu />;
  if (route === 'settings') return <Settings />;
  if (route === 'contact') return <Contact />;
  if (route === 'invite') return <Invite />;
  if (route === 'block-user') return <RestrictedUsers kind="blocked" />;
  if (route === 'mute-report') return <RestrictedUsers kind="muted" />;
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
  inviteTitle: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  inviteBody: { fontSize: 15, lineHeight: 23, color: colors.text },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    ...layout.shadow,
  },
  questionText: { ...typography.h3, color: colors.darkText },
  requestRow: { flexDirection: 'row', gap: spacing.md, padding: spacing.md },
  requestButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  authorLine: { fontFamily: fonts.nunitoBold, fontSize: 16, color: colors.darkText },
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
