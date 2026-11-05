import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { tokens } from '@/lib/secure';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8000/api/';

export const api = axios.create({ baseURL: API_URL, timeout: 20_000 });

let onSignedOut: (() => void) | undefined;
export const setSignedOutHandler = (fn: () => void) => {
  onSignedOut = fn;
};

api.interceptors.request.use(async (config) => {
  const access = await tokens.getAccess();
  if (access) config.headers.set('Authorization', `Bearer ${access}`);
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccess(): Promise<string | null> {
  const refresh = await tokens.getRefresh();
  if (!refresh) return null;
  try {
    const { data } = await axios.post<{ access: string }>(`${API_URL}token/refresh/`, { refresh });
    await tokens.set(data.access);
    return data.access;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    if (error.response?.status !== 401 || !original || original._retry) throw error;
    original._retry = true;
    refreshing ??= refreshAccess().finally(() => {
      refreshing = null;
    });
    const access = await refreshing;
    if (!access) {
      await tokens.clear();
      onSignedOut?.();
      throw error;
    }
    original.headers.set('Authorization', `Bearer ${access}`);
    return api(original);
  },
);
