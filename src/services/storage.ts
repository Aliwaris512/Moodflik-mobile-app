import * as SecureStore from 'expo-secure-store';
import type { AuthSession } from '@/types/moodflik';

const SESSION_KEY = 'moodflik.auth.session';

export async function readSession(): Promise<AuthSession | null> {
  try {
    const value = await SecureStore.getItemAsync(SESSION_KEY);
    if (!value) return null;
    const session = JSON.parse(value) as AuthSession;
    // Sessions saved by the old mock build ('mock-access-token', user id 'me') are not real logins.
    const looksReal =
      session.accessToken?.split('.').length === 3 &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session.userId ?? '');
    if (!looksReal) {
      await SecureStore.deleteItemAsync(SESSION_KEY);
      return null;
    }
    return session;
  } catch (error) {
    console.error('Unable to read Moodflik session', error);
    throw new Error('We could not restore your session. Please sign in again.', { cause: error });
  }
}

export async function writeSession(session: AuthSession): Promise<void> {
  try {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Unable to persist Moodflik session', error);
    throw new Error('We could not securely save your session.', { cause: error });
  }
}

export async function clearSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch (error) {
    console.error('Unable to clear Moodflik session', error);
    throw new Error('We could not sign you out completely. Please try again.', { cause: error });
  }
}
