import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { login, signUp as registerAccount } from '@/api/auth';
import { apiMessage, fieldErrors } from '@/api/auth/errors';
import { pendingLogin } from '@/api/auth/pending';
import { setSignedOutHandler } from '@/api/client';
import { queryClient } from '@/lib/query';
import { tokens } from '@/lib/secure';
import { clearSession, readSession, writeSession } from '@/services/storage';
import type { AuthSession, AuthState } from '@/types/moodflik';

export type SignUpFields = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  /** DD/MM/YYYY, as typed in the form. */
  dob: string;
  gender: string;
};

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fields: SignUpFields) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const GENDERS: Record<string, 'M' | 'F' | 'NA'> = { Male: 'M', Female: 'F' };

function toIsoDate(dob: string) {
  const [day = '', month = '', year = ''] = dob.split('/');
  return `${year}-${month}-${day}`;
}

/** Logs in, keeps the JWTs in the secure store and returns the session to show in the app. */
async function openSession(email: string, password: string): Promise<AuthSession> {
  const result = await login({ email, password });
  if (result.deactivated) {
    pendingLogin.set({ token: result.accessToken, uuid: result.uuid });
    throw new Error('Your account is deactivated. Please reactivate it to continue.');
  }
  await tokens.set(result.accessToken, result.refreshToken);
  const session: AuthSession = {
    accessToken: result.accessToken,
    userId: result.uuid,
    email: result.email,
  };
  await writeSession(session);
  return session;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthState['status']>('loading');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The API client calls this when a token refresh fails.
    setSignedOutHandler(() => {
      void clearSession().catch(() => undefined);
      setSession(null);
      setStatus('signedOut');
    });
    Promise.all([readSession(), tokens.getAccess()])
      .then(([stored, access]) => {
        if (stored && access) {
          setSession({ ...stored, accessToken: access });
          setStatus('signedIn');
        } else {
          setStatus('signedOut');
        }
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
          const next = await openSession(email, password);
          setSession(next);
          setStatus('signedIn');
        } catch (reason: unknown) {
          const message = apiMessage(reason, 'Unable to sign in right now.');
          setError(message);
          throw new Error(message, { cause: reason });
        }
      },
      signUp: async (fields) => {
        try {
          setError(null);
          await registerAccount({
            first_name: fields.firstName.trim(),
            last_name: fields.lastName.trim(),
            username: fields.username,
            email: fields.email,
            password: fields.password,
            date_of_birth: toIsoDate(fields.dob),
            gender: GENDERS[fields.gender] ?? 'NA',
            terms_confirmed: 1,
          });
          const next = await openSession(fields.email, fields.password);
          setSession(next);
          setStatus('signedIn');
        } catch (reason: unknown) {
          const fieldsInError = fieldErrors(reason);
          const message = fieldsInError.username
            ? 'A user with this username already exists.'
            : fieldsInError.date_of_birth
              ? 'You must be aged 13 or over to sign up!'
              : /already exist/i.test(apiMessage(reason, ''))
                ? 'This email already exists.'
                : apiMessage(reason, 'Unable to create your account right now.');
          setError(message);
          throw new Error(message, { cause: reason });
        }
      },
      signOut: async () => {
        await tokens.clear();
        queryClient.clear();
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
