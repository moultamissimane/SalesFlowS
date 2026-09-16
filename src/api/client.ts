import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// The access token lives in memory only (never localStorage) - refresh happens via the
// httpOnly refresh_token cookie the backend sets on /auth/login|register|refresh.
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

const performRefresh = async (): Promise<string | null> => {
  try {
    const response = await axios.post(
      '/api/v1/auth/refresh',
      {},
      { withCredentials: true }
    );
    const token = response.data.accessToken as string;
    setAccessToken(token);
    return token;
  } catch {
    setAccessToken(null);
    return null;
  }
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const isAuthEndpoint = config?.url?.startsWith('/auth/');

    if (error.response?.status === 401 && config && !config._retry && !isAuthEndpoint) {
      config._retry = true;
      refreshPromise = refreshPromise ?? performRefresh();
      const newToken = await refreshPromise;
      refreshPromise = null;

      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(config);
      }
    }

    return Promise.reject(error);
  }
);

export const tryRestoreSession = () => performRefresh();
