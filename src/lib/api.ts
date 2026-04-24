import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '@/features/auth/store';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export interface ApiErrorPayload {
  message?: string;
  detail?: string | Array<{ msg: string; loc?: (string | number)[] }>;
  code?: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function normalizeMessage(payload: ApiErrorPayload | undefined, fallback: string): string {
  if (!payload) return fallback;
  if (typeof payload.message === 'string') return payload.message;
  if (typeof payload.detail === 'string') return payload.detail;
  if (Array.isArray(payload.detail) && payload.detail[0]?.msg) return payload.detail[0].msg;
  return fallback;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    const status = error.response?.status ?? 0;
    const payload = error.response?.data;
    const message = normalizeMessage(payload, error.message ?? 'Unknown error');

    if (status === 401) {
      useAuthStore.getState().clearToken();
    }

    return Promise.reject(new ApiError(message, status, payload?.code, payload?.details));
  },
);
