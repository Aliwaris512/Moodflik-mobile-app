import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { AuthSession, AuthState, User } from '@/types/moodflik';
import { setAuthToken, setUnauthorizedHandler } from '@/services/api';
import {
  authService,
  profileService,
  setCurrentUserId,
  type SignUpInput,
} from '@/services/repositories';
import { openSocket } from '@/services/realtime';
import { clearSession, readSession, writeSession } from '@/services/storage';

type Counts = { notifications: number; messages: number };

type AuthContextValue = AuthState & {
  /** The signed-in user's profile (a placeholder built from the session until it loads). */
  user: User | null;
  counts: Counts;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshCounts: () => Promise<void>;
  setCounts: (next: Partial<Counts>) => void;
  error: string | null;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const placeholderUser = (session: AuthSession): User => ({
  id: session.userId,
  username: session.email.split('@')[0],
  displayName: session.email.split('@')[0],
  bio: '',
  followers: 0,
  following: 0,
});

const COUNT_POLL_MS = 30000;

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthState['status']>('loading');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [counts, setCountsState] = useState<Counts>({ notifications: 0, messages: 0 });
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<AuthSession | null>(null);

  const activate = useCallback(async (next: AuthSession) => {
    setAuthToken(next.accessToken);
    setCurrentUserId(next.userId);
    sessionRef.current = next;
    setSession(next);
    setUser(placeholderUser(next));
    setStatus('signedIn');
    try {
      setUser(await profileService.getUser(next.userId));
    } catch (reason: unknown) {
      console.error('Unable to load the signed-in profile', reason);
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setCurrentUserId(null);
    sessionRef.current = null;
    setSession(null);
    setUser(null);
    setCountsState({ notifications: 0, messages: 0 });
    setStatus('signedOut');
    try {
      await clearSession();
    } catch (reason: unknown) {
      console.error('Unable to clear the stored session', reason);
    }
  }, []);

  useEffect(() => {
    // An expired or revoked token on any request signs the user out.
    setUnauthorizedHandler(() => {
      if (sessionRef.current) {
        setError('Your session has expired. Please sign in again.');
        void signOut();
      }
    });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  useEffect(() => {
    readSession()
      .then((stored) => {
        if (stored) void activate(stored);
        else setStatus('signedOut');
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'We could not restore your session.');
        setStatus('signedOut');
      });
  }, [activate]);

  const refreshCounts = useCallback(async () => {
    const current = sessionRef.current;
    if (!current) return;
    try {
      setCountsState(await profileService.counts(current.userId));
    } catch (reason: unknown) {
      console.error('Unable to refresh badge counts', reason);
    }
  }, []);

  // Keep header badges fresh: poll, and refresh immediately when the server pushes a notification.
  useEffect(() => {
    if (status !== 'signedIn' || !session) return;
    void refreshCounts();
    const timer = setInterval(() => void refreshCounts(), COUNT_POLL_MS);
    const socket = openSocket(
      `/ws/notification-server/${session.userId}/`,
      (data) => {
        if (data.type === 'notification') void refreshCounts();
      },
      { reconnect: true },
    );
    return () => {
      clearInterval(timer);
      socket.close();
    };
  }, [status, session, refreshCounts]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user,
      counts,
      error,
      clearError: () => setError(null),
      setCounts: (next) => setCountsState((current) => ({ ...current, ...next })),
      refreshCounts,
      refreshUser: async () => {
        const current = sessionRef.current;
        if (current) setUser(await profileService.getUser(current.userId));
      },
      signIn: async (email, password) => {
        try {
          setError(null);
          const next = await authService.signIn(email, password);
          await writeSession(next);
          await activate(next);
        } catch (reason: unknown) {
          const message = reason instanceof Error ? reason.message : 'Unable to sign in right now.';
          setError(message);
          throw new Error(message, { cause: reason });
        }
      },
      signUp: async (input) => {
        try {
          setError(null);
          const next = await authService.signUp(input);
          await writeSession(next);
          await activate(next);
        } catch (reason: unknown) {
          const message =
            reason instanceof Error ? reason.message : 'Unable to create your account right now.';
          setError(message);
          throw new Error(message, { cause: reason });
        }
      },
      signOut,
    }),
    [activate, counts, error, refreshCounts, session, signOut, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}

/** The signed-in user. Only call inside screens that require a session. */
export function useMe(): User {
  const { user } = useAuth();
  return (
    user ?? {
      id: '',
      username: '',
      displayName: '',
      bio: '',
      followers: 0,
      following: 0,
    }
  );
}
