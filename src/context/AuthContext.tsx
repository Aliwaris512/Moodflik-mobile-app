import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { AuthSession, AuthState } from '@/types/moodflik';
import { authService } from '@/services/repositories';
import { clearSession, readSession, writeSession } from '@/services/storage';

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthState['status']>('loading');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    readSession()
      .then((stored) => {
        setSession(stored);
        setStatus(stored ? 'signedIn' : 'signedOut');
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'We could not restore your session.');
        setStatus('signedOut');
      });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      error,
      clearError: () => setError(null),
      signIn: async (email, password) => {
        try {
          setError(null);
          const next = await authService.signIn(email, password);
          await writeSession(next);
          setSession(next);
          setStatus('signedIn');
        } catch (reason: unknown) {
          const message = reason instanceof Error ? reason.message : 'Unable to sign in right now.';
          setError(message);
          throw new Error(message, { cause: reason });
        }
      },
      signUp: async (email, password, displayName) => {
        try {
          setError(null);
          const next = await authService.signUp(email, password, displayName);
          await writeSession(next);
          setSession(next);
          setStatus('signedIn');
        } catch (reason: unknown) {
          const message =
            reason instanceof Error ? reason.message : 'Unable to create your account right now.';
          setError(message);
          throw new Error(message, { cause: reason });
        }
      },
      signOut: async () => {
        await clearSession();
        setSession(null);
        setStatus('signedOut');
      },
    }),
    [error, session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
