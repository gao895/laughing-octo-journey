'use client';

import type { PreparedImage } from '@/types/artwork';
import { FriendlyError } from '@/lib/errors';
import { t } from '@/lib/i18n';

/** Long side of the image shown in the detail modal and on large screens. */
export const FULL_MAX = 1600;
/** Long side of the thumbnail used by cards and the mobile 3D view. */
export const THUMB_MAX = 512;

async function loadBitmap(source: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(source);
    } catch {
      // Fall back to <img> decoding below (e.g. SVG in some browsers).
    }
  }
  const url = URL.createObjectURL(source);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function sizeOf(img: ImageBitmap | HTMLImageElement): { w: number; h: number } {
  return 'naturalWidth' in img
    ? { w: img.naturalWidth || img.width, h: img.naturalHeight || img.height }
    : { w: img.width, h: img.height };
}

async function encode(
  img: ImageBitmap | HTMLImageElement,
  maxSide: number,
  quality: number,
): Promise<{ blob: Blob; width: number; height: number }> {
  const { w, h } = sizeOf(img);
  const ratio = Math.min(1, maxSide / Math.max(w, h));
  const width = Math.max(1, Math.round(w * ratio));
  const height = Math.max(1, Math.round(h * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new FriendlyError(t.errors.imageBroken);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  const toBlob = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  // Safari may not encode WebP; it silently returns PNG, so fall back to JPEG instead.
  let blob = await toBlob('image/webp');
  if (!blob || blob.type !== 'image/webp') blob = await toBlob('image/jpeg');
  if (!blob) throw new FriendlyError(t.errors.imageBroken);
  return { blob, width, height };
}

function titleFromFileName(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .slice(0, 60);
}

/**
 * Resizes and re-encodes an image in the browser so huge originals are never
 * uploaded or loaded into the 3D scene. Also strips EXIF metadata (e.g. GPS).
 */
export async function prepareImage(source: Blob, fileName = ''): Promise<PreparedImage> {
  let img: ImageBitmap | HTMLImageElement;
  try {
    img = await loadBitmap(source);
  } catch (e) {
    throw new FriendlyError(t.errors.imageBroken, e);
  }
  const full = await encode(img, FULL_MAX, 0.86);
  const thumbnail = await encode(img, THUMB_MAX, 0.8);
  if ('close' in img) img.close();
  return {
    full: full.blob,
    thumbnail: thumbnail.blob,
    width: full.width,
    height: full.height,
    suggestedTitle: titleFromFileName(fileName),
  };
}

export function extensionForBlob(blob: Blob): 'webp' | 'jpg' {
  return blob.type === 'image/webp' ? 'webp' : 'jpg';
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
