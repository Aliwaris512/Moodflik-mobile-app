const firstString = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstString(item);
      if (found) return found;
    }
    return null;
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) {
      const found = firstString(item);
      if (found) return found;
    }
  }
  return null;
};

/** The backend answers errors in several shapes; this finds the human sentence in any of them. */
export function extractMessage(body: unknown, fallback: string): string {
  if (typeof body === 'string') return body.trim().startsWith('<') ? fallback : body || fallback;
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    for (const key of ['message', 'detail', 'error', 'Error', 'msg', 'response']) {
      const found = firstString(record[key]);
      if (found) return found;
    }
    return firstString(record) ?? fallback;
  }
  return fallback;
}
