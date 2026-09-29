import { describe, expect, it } from 'vitest';
import {
  MAX_IMAGE_BYTES,
  safeMediaUrl,
  sanitizeText,
  validateAudioFile,
  validateGalleryTitle,
  validateImageFile,
} from '@/lib/gallery/validation';
import { createSlug, isValidSlug } from '@/lib/gallery/slug';
import { safeNextPath } from '@/lib/visitor';
import { toFriendlyMessage, FriendlyError } from '@/lib/errors';
import { t } from '@/lib/i18n';

describe('validateImageFile', () => {
  it('accepts jpg / png / webp up to 10MB', () => {
    for (const [name, type] of [
      ['a.jpg', 'image/jpeg'],
      ['a.JPEG', 'image/jpeg'],
      ['a.png', 'image/png'],
      ['a.webp', 'image/webp'],
    ]) {
      expect(validateImageFile({ name: name!, type: type!, size: 1000 }).ok).toBe(true);
    }
  });
  it('rejects other formats with a friendly message', () => {
    expect(validateImageFile({ name: 'a.gif', type: 'image/gif', size: 10 })).toEqual({
      ok: false,
      message: t.errors.fileType,
    });
    expect(validateImageFile({ name: 'a.png.exe', type: 'image/png', size: 10 }).ok).toBe(false);
    expect(validateImageFile({ name: 'a.svg', type: 'image/svg+xml', size: 10 }).ok).toBe(false);
  });
  it('rejects files that are too large', () => {
    expect(
      validateImageFile({ name: 'a.png', type: 'image/png', size: MAX_IMAGE_BYTES + 1 }),
    ).toEqual({
      ok: false,
      message: t.errors.fileTooLarge,
    });
  });
});

describe('validateAudioFile', () => {
  it('accepts mp3 and wav only', () => {
    expect(validateAudioFile({ name: 'a.mp3', type: 'audio/mpeg', size: 10 }).ok).toBe(true);
    expect(validateAudioFile({ name: 'a.wav', type: 'audio/wav', size: 10 }).ok).toBe(true);
    expect(validateAudioFile({ name: 'a.ogg', type: 'audio/ogg', size: 10 }).ok).toBe(false);
  });
});

describe('sanitizeText', () => {
  it('removes control / bidi characters and trims', () => {
    expect(sanitizeText('  星空\u0000の‮記憶  ', 60)).toBe('星空の記憶');
  });
  it('keeps newlines only for multiline text', () => {
    expect(sanitizeText('a\nb', 10)).toBe('a b');
    expect(sanitizeText('a\nb', 10, { multiline: true })).toBe('a\nb');
  });
  it('limits length by characters (not UTF-16 units)', () => {
    expect(sanitizeText('🌟'.repeat(10), 3)).toBe('🌟🌟🌟');
  });
});

describe('validateGalleryTitle', () => {
  it('requires a non-empty title up to 60 characters', () => {
    expect(validateGalleryTitle('   ').ok).toBe(false);
    expect(validateGalleryTitle('星空の記憶').ok).toBe(true);
    expect(validateGalleryTitle('あ'.repeat(61)).ok).toBe(false);
  });
});

describe('safeMediaUrl', () => {
  it('blocks javascript: and other unsafe schemes', () => {
    expect(safeMediaUrl('javascript:alert(1)')).toBeNull();
    expect(safeMediaUrl('//evil.example/x.png')).toBeNull();
    expect(safeMediaUrl('data:text/html,<script>')).toBeNull();
    expect(safeMediaUrl('https://x.supabase.co/a.webp')).toBe('https://x.supabase.co/a.webp');
    expect(safeMediaUrl('data:image/webp;base64,AAAA')).toBe('data:image/webp;base64,AAAA');
  });
});

describe('slug', () => {
  it('romanised titles keep their words and get a random suffix', () => {
    const slug = createSlug('Summer Memories!');
    expect(slug).toMatch(/^summer-memories-[a-z0-9]{6}$/);
    expect(isValidSlug(slug)).toBe(true);
  });
  it('Japanese-only titles get a short random slug', () => {
    const slug = createSlug('夏の思い出');
    expect(slug).toMatch(/^[a-z0-9]{8}$/);
    expect(createSlug('夏の思い出')).not.toBe(slug);
  });
  it('rejects malformed slugs', () => {
    expect(isValidSlug('../etc')).toBe(false);
    expect(isValidSlug('Abc')).toBe(false);
  });
});

describe('safeNextPath', () => {
  it('prevents open redirects', () => {
    expect(safeNextPath('https://evil.example')).toBe('/dashboard');
    expect(safeNextPath('//evil.example')).toBe('/dashboard');
    expect(safeNextPath('/\\evil.example')).toBe('/dashboard');
    expect(safeNextPath('/dashboard/new')).toBe('/dashboard/new');
  });
});

describe('toFriendlyMessage', () => {
  it('never exposes technical messages', () => {
    expect(toFriendlyMessage(new Error('Storage upload error 403'))).toBe(t.errors.generic);
    expect(toFriendlyMessage(new FriendlyError(t.errors.upload))).toBe(t.errors.upload);
  });
});
