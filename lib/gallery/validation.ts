import { t } from '@/lib/i18n';

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;
export const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
] as const;
export const ALLOWED_AUDIO_EXTENSIONS = ['mp3', 'wav'] as const;
export const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
export const AUDIO_ACCEPT = '.mp3,.wav,audio/mpeg,audio/wav';

export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 1000;
export const DISPLAY_NAME_MAX = 50;

export type ValidationResult = { ok: true } | { ok: false; message: string };

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

/** Checks both MIME type and extension; the server (Storage bucket) re-checks MIME and size. */
export function validateImageFile(file: {
  name: string;
  type: string;
  size: number;
}): ValidationResult {
  const ext = extensionOf(file.name);
  const typeOk = (ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type);
  const extOk = (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext);
  if (!typeOk || !extOk) return { ok: false, message: t.errors.fileType };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, message: t.errors.fileTooLarge };
  if (file.size === 0) return { ok: false, message: t.errors.imageBroken };
  return { ok: true };
}

export function validateAudioFile(file: {
  name: string;
  type: string;
  size: number;
}): ValidationResult {
  const ext = extensionOf(file.name);
  const typeOk = (ALLOWED_AUDIO_TYPES as readonly string[]).includes(file.type);
  const extOk = (ALLOWED_AUDIO_EXTENSIONS as readonly string[]).includes(ext);
  if (!typeOk || !extOk) return { ok: false, message: t.errors.audioType };
  if (file.size > MAX_AUDIO_BYTES) return { ok: false, message: t.errors.audioTooLarge };
  return { ok: true };
}

/**
 * Normalises free text typed by users. React escapes everything we render, and we never
 * use dangerouslySetInnerHTML, so this focuses on removing invisible/control characters
 * and enforcing length limits (the database enforces the same limits).
 */
export function sanitizeText(value: string, maxLength: number, { multiline = false } = {}): string {
  let s = value.normalize('NFC');
  // Single-line text: turn line breaks / tabs into spaces first.
  if (!multiline) s = s.replace(/\s+/g, ' ');
  // Strip remaining control characters (newlines/tabs survive in multiline text) and bidi overrides.
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  s = s.replace(/[\u202A-\u202E\u2066-\u2069\u200B\uFEFF]/g, '');
  s = s.trim();
  return Array.from(s).slice(0, maxLength).join('');
}

export function validateGalleryTitle(raw: string): ValidationResult {
  const title = sanitizeText(raw, TITLE_MAX + 1);
  if (!title) return { ok: false, message: t.errors.titleRequired };
  if (Array.from(title).length > TITLE_MAX) return { ok: false, message: t.errors.titleTooLong };
  return { ok: true };
}

export function validateEmail(email: string): ValidationResult {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ? { ok: true }
    : { ok: false, message: t.errors.invalidEmail };
}

export function validatePassword(password: string): ValidationResult {
  return password.length >= 8 ? { ok: true } : { ok: false, message: t.errors.weakPassword };
}

/** Allows only URLs that are safe to put in src/href attributes. */
export function safeMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('data:image/') || url.startsWith('data:audio/') || url.startsWith('blob:'))
    return url;
  if (url.startsWith('/')) return url.startsWith('//') ? null : url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
