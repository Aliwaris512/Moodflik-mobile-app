import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { setSignedOutHandler } from '@/api/client';
import { queryClient } from '@/lib/query';
import { tokens } from '@/lib/secure';

type Status = 'loading' | 'signedIn' | 'signedOut';

type AuthValue = {
  status: Status;
  signIn: (access: string, refresh?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');

  const signOut = useCallback(async () => {
    await tokens.clear();
    queryClient.clear();
    setStatus('signedOut');
  }, []);

  const signIn = useCallback(async (access: string, refresh?: string) => {
    await tokens.set(access, refresh);
    setStatus('signedIn');
  }, []);

  useEffect(() => {
    setSignedOutHandler(() => setStatus('signedOut'));
    void tokens.getAccess().then((t) => setStatus(t ? 'signedIn' : 'signedOut'));
  }, []);

  const value = useMemo(() => ({ status, signIn, signOut }), [status, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
