import { API_URL } from '@/api/client';

/** `ws(s)://host[:port]/ws/<path>` derived from the REST base unless overridden. */
export function wsUrl(path: string) {
  const base =
    process.env.EXPO_PUBLIC_WS_URL ?? `${API_URL.replace(/^http/, 'ws').replace(/api\/?$/, '')}ws/`;
  return `${base.endsWith('/') ? base : `${base}/`}${path}`;
}
