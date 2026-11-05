/** Server timestamps are naive UTC (`YYYY-MM-DD HH:MM:SS`); optimistic ones are ISO strings. */
export function parseServerDate(value: string) {
  const iso = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  return new Date(iso);
}

export function formatTime(value: string | null | undefined) {
  if (!value) return '';
  const date = parseServerDate(value);
  if (Number.isNaN(date.getTime())) return '';
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export const fullName = (u: { first_name: string; last_name: string }) =>
  `${u.first_name} ${u.last_name}`.trim();
