export function timeAgo(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const units: [string, number][] = [
    ['y', 365 * 864e5],
    ['mo', 30 * 864e5],
    ['d', 864e5],
    ['h', 36e5],
    ['m', 6e4],
  ];
  for (const [label, ms] of units) if (diff >= ms) return `${Math.floor(diff / ms)}${label} ago`;
  return 'just now';
}

export function compactNumber(n: number | undefined): string {
  const value = n ?? 0;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1).replace(/\.0$/, '')}k`;
  return String(value);
}

export const handle = (username: string | undefined) =>
  username ? (username.startsWith('@') ? username : `@${username}`) : '';
