import { AxiosError } from 'axios';

// Backend error envelope: { error, details?, code? }
interface ApiErrorBody {
  error?: string;
  details?: Record<string, string[]>;
  code?: string;
}

export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof AxiosError) {
    const body = err.response?.data as ApiErrorBody | undefined;
    if (body?.error) return body.error;
    if (body?.details) {
      const first = Object.values(body.details)[0]?.[0];
      if (first) return first;
    }
    if (err.code === 'ERR_NETWORK') {
      return 'Cannot reach the server. Is the backend running?';
    }
    return err.message;
  }
  return fallback;
}
