import { isAxiosError } from 'axios';

/** Pull the most useful human message out of an API error (envelope or DRF field errors). */
export function apiMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (!isAxiosError(error)) return error instanceof Error ? error.message : fallback;
  const data: unknown = error.response?.data;
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    const body = data as Record<string, unknown>;
    if (typeof body.message === 'string') return body.message;
    if (typeof body.detail === 'string') return body.detail;
    const first = Object.values(body)[0];
    if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
    if (typeof first === 'string') return first;
  }
  return error.response ? fallback : 'Network error. Check your connection.';
}

/** DRF field errors keyed by field name, when present. */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!isAxiosError(error)) return {};
  const data: unknown = error.response?.data;
  if (!data || typeof data !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (Array.isArray(value) && typeof value[0] === 'string') out[key] = value[0];
  }
  return out;
}
