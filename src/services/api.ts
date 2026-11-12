import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { extractMessage } from './errors';

export { extractMessage };

/**
 * Base URL of the Moodflik Django API.
 * Override with EXPO_PUBLIC_API_URL (e.g. https://api.moodflik.com/api). In development the host of
 * the Expo dev server is reused so a physical device reaches the backend running on the same computer.
 */
function resolveBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:8000/api`;
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000/api';
  return 'http://localhost:8000/api';
}

export const API_BASE = resolveBaseUrl();
export const WS_BASE = API_BASE.replace(/^http/, 'ws').replace(/\/api$/, '');

const TIMEOUT_MS = 20000;
const UPLOAD_TIMEOUT_MS = 90000;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ApiError';
    this.status = status;
  }
}

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};
export const getAuthToken = () => authToken;
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  unauthorizedHandler = handler;
};

type Query = Record<string, string | number | boolean | undefined | null>;

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  form?: FormData;
  query?: Query;
  /** Sends the bearer token and signs the user out on 401. Disable for login and public calls. */
  auth?: boolean;
  fallbackError?: string;
  timeoutMs?: number;
};

const withQuery = (path: string, query?: Query) => {
  if (!query) return path;
  const parts = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return parts.length ? `${path}${path.includes('?') ? '&' : '?'}${parts.join('&')}` : path;
};

export async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, form, query, auth = true, fallbackError, timeoutMs } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (auth && authToken) headers.Authorization = `Bearer ${authToken}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  // The Django dev server closes idle keep-alive connections; reusing one makes Android report a
  // network failure. Ask for a fresh connection, and retry safe requests once if one still drops.
  if (Platform.OS !== 'web') headers.Connection = 'close';
  // Some mobile networks mishandle PATCH/PUT/DELETE; the backend accepts them tunnelled over POST.
  const wireMethod = method === 'GET' || method === 'POST' ? method : 'POST';
  if (wireMethod !== method) headers['X-HTTP-Method-Override'] = method;
  const retryable = method !== 'POST';
  let response: Response | undefined;
  for (let attempt = 0; !response; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs ?? TIMEOUT_MS);
    try {
      response = await fetch(`${API_BASE}${withQuery(path, query)}`, {
        method: wireMethod,
        headers,
        body:
          form ??
          (body !== undefined ? JSON.stringify(body) : wireMethod === 'POST' ? '' : undefined),
        signal: controller.signal,
      });
    } catch (reason: unknown) {
      const aborted = reason instanceof Error && reason.name === 'AbortError';
      if (!aborted && retryable && attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        continue;
      }
      throw new ApiError(
        aborted
          ? 'The server took too long to respond. Please try again.'
          : `Cannot reach Moodflik at ${API_BASE} (${reason instanceof Error ? reason.message : 'network error'}). Check that the backend is running and your phone is on the same Wi-Fi.`,
        0,
        { cause: reason },
      );
    } finally {
      clearTimeout(timer);
    }
  }

  const text = await response.text();
  let data: unknown = text;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  } else {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401 && auth && authToken) unauthorizedHandler?.();
    throw new ApiError(
      extractMessage(data, fallbackError ?? `Something went wrong (${response.status}).`),
      response.status,
    );
  }
  return data as T;
}

export type PickedFile = { uri: string; fileName?: string | null; mimeType?: string | null };

/** Uploads a picked image/video and returns its public URL. */
export async function uploadFile(file: PickedFile | string, dir = 'img'): Promise<string> {
  const picked = typeof file === 'string' ? { uri: file } : file;
  const mimeType = picked.mimeType || undefined;
  const isVideo = mimeType?.startsWith('video/') || /\.(mp4|mov|m4v|webm)(\?|$)/i.test(picked.uri);
  const ext = (mimeType?.split('/')[1] || (isVideo ? 'mp4' : 'jpg')).replace('jpeg', 'jpg');
  // Never derive the name from the URI: web gives data:/blob: URIs and Android gives content:// ids.
  const name = picked.fileName || `upload-${Date.now()}.${ext}`;
  const type = mimeType || (isVideo ? 'video/mp4' : 'image/jpeg');
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(picked.uri)).blob();
    form.append('file', blob, name);
  } else {
    // React Native's FormData accepts a { uri, name, type } descriptor.
    form.append('file', { uri: picked.uri, name, type } as unknown as Blob);
  }
  form.append('dir_name', dir);
  const result = await sendForm<{ file_url: string }>('/upload/', form);
  return result.file_url;
}

/**
 * Multipart upload through XMLHttpRequest, which is the most dependable way to send files from
 * React Native. Reports the HTTP status or the network failure so problems are diagnosable.
 */
function sendForm<T>(path: string, form: FormData): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}${path}`);
    xhr.timeout = UPLOAD_TIMEOUT_MS;
    xhr.setRequestHeader('Accept', 'application/json');
    if (authToken) xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
    xhr.onload = () => {
      let data: unknown = xhr.responseText;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // keep the raw text for the error message
      }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(data as T);
      if (xhr.status === 401 && authToken) unauthorizedHandler?.();
      reject(new ApiError(extractMessage(data, `Upload failed (HTTP ${xhr.status}).`), xhr.status));
    };
    xhr.onerror = () =>
      reject(
        new ApiError(
          `Upload failed: could not reach ${API_BASE}. Check the backend is running and your phone is on the same Wi-Fi.`,
          0,
        ),
      );
    xhr.ontimeout = () =>
      reject(
        new ApiError('The upload took too long. Try a smaller picture or a better connection.', 0),
      );
    xhr.send(form);
  });
}
