import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/stores/authStore';
import type { RefreshResponse } from '@/types/auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// withCredentials sends the httpOnly refresh cookie (needed by /auth/refresh
// and /auth/logout; harmless elsewhere).
export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Interceptor-free client for /auth/refresh, so a 401 there can't recurse.
const refreshClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// _retry ensures a request is retried at most once (no 401->refresh->401 loop).
interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// Shared in-flight refresh so concurrent 401s trigger a single refresh.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<RefreshResponse>('/auth/refresh')
      .then((res) => {
        const { accessToken, user, forcePasswordChange } = res.data;
        // The whole session, not just the token: after a reload the store is
        // empty, and the router needs the user before it can route anywhere.
        useAuthStore.getState().setSession({ accessToken, user, forcePasswordChange });
        return accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}


// Rebuild the session from the refresh cookie alone. Used on every page load,
// and by the timer window, which opens in a new tab holding no token.
export async function bootstrapSession(): Promise<string> {
  return refreshAccessToken();
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (RetriableConfig & InternalAxiosRequestConfig) | undefined;
    const status = error.response?.status;

    // Backend returns 403 FORCE_PASSWORD_CHANGE until the initial password is
    // changed; flip the store flag so the router redirects.
    const code = (error.response?.data as { code?: string } | undefined)?.code;
    if (status === 403 && code === 'FORCE_PASSWORD_CHANGE') {
      useAuthStore.setState({ forcePasswordChange: true });
      return Promise.reject(error);
    }

    const isAuthCall = original?.url?.includes('/auth/');
    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        const newToken = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        // Refresh failed -> session is dead.
        useAuthStore.getState().reset();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
