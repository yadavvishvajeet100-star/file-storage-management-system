import type { ApiError } from '@/types';

export function getErrorMessage(error: unknown): string {
  if (!error) return 'Something went wrong.';

  if (typeof error === 'string') return error;

  if (error instanceof Error) {
    const msg = error.message;

    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      return 'Network error. Please check your connection and try again.';
    }

    return msg;
  }

  const err = error as Record<string, unknown>;

  if (err.message && typeof err.message === 'string') {
    return err.message as string;
  }

  if (err.error_description && typeof err.error_description === 'string') {
    return err.error_description as string;
  }

  if (err.error && typeof err.error === 'string') {
    return err.error as string;
  }

  return 'Something went wrong.';
}

export function getAuthErrorMessage(error: unknown): string {
  const err = error as Record<string, unknown>;
  const message = (err?.message as string) || '';

  if (message.includes('Invalid login credentials')) return 'Invalid email or password.';
  if (message.includes('User already registered')) return 'An account with this email already exists.';
  if (message.includes('Password should be at least')) return 'Password must be at least 6 characters.';
  if (message.includes('Unable to validate email address')) return 'Please enter a valid email address.';
  if (message.includes('Email not confirmed')) return 'Please check your email and confirm your account.';

  return getErrorMessage(error);
}

export function createApiError(message: string, code?: string, status?: number): ApiError {
  return { message, code, status };
}
