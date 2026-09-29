import { t } from '@/lib/i18n';

/** Error carrying a message that is safe to show to beginners. */
export class FriendlyError extends Error {
  constructor(
    public readonly friendly: string,
    public readonly cause?: unknown,
  ) {
    super(friendly);
    this.name = 'FriendlyError';
  }
}

/** Logs technical details in development only. */
export function logDev(context: string, error: unknown): void {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${context}]`, error);
  }
}

/**
 * Converts any thrown value into a user-friendly Japanese message.
 * Raw technical messages (e.g. "Storage upload error 403") are never shown.
 */
export function toFriendlyMessage(error: unknown, fallback: string = t.errors.generic): string {
  if (error instanceof FriendlyError) return error.friendly;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return t.errors.network;
  if (error instanceof TypeError && /fetch|network/i.test(error.message)) return t.errors.network;
  if (error instanceof DOMException && error.name === 'QuotaExceededError')
    return t.errors.storageFull;
  return fallback;
}
