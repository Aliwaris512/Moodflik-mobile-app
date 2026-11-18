import { useEffect, useState } from 'react';

import { tokens } from '@/lib/secure';

/** `user_id` claim of the simplejwt access token (the same claim the WebSocket middleware trusts). */
export function userIdFromToken(access: string | null): string | null {
  if (!access) return null;
  try {
    const payload = access.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!payload) return null;
    const json = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '='))) as {
      user_id?: string;
    };
    return json.user_id ?? null;
  } catch {
    return null;
  }
}

export function useMyUserId() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    void tokens.getAccess().then((t) => setId(userIdFromToken(t)));
  }, []);
  return id;
}
