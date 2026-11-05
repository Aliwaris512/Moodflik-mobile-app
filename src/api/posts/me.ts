import { tokens } from '@/lib/secure';

/** Reads the signed-in user's uuid from the JWT `user_id` claim (simplejwt default). */
export async function getMyUserId(): Promise<string | null> {
  const access = await tokens.getAccess();
  if (!access) return null;
  try {
    const payload = access.split('.')[1] ?? '';
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const claims = JSON.parse(json) as { user_id?: string };
    return claims.user_id ?? null;
  } catch {
    return null;
  }
}
