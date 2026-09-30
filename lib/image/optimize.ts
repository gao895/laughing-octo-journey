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

type Drawable = ImageBitmap | HTMLImageElement | HTMLVideoElement;

function sizeOf(img: Drawable): { w: number; h: number } {
  if ('videoWidth' in img) return { w: img.videoWidth, h: img.videoHeight };
  return 'naturalWidth' in img
    ? { w: img.naturalWidth || img.width, h: img.naturalHeight || img.height }
    : { w: img.width, h: img.height };
}

async function encode(
  img: Drawable,
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

const VIDEO_TIMEOUT_MS = 15000;

/** Waits for a media event, failing on error or timeout. */
function once(video: HTMLVideoElement, event: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`video ${event} timeout`)), VIDEO_TIMEOUT_MS);
    const done = (fn: () => void) => () => {
      clearTimeout(timer);
      video.removeEventListener(event, ok);
      video.removeEventListener('error', fail);
      fn();
    };
    const ok = done(resolve);
    const fail = done(() => reject(video.error ?? new Error('video error')));
    video.addEventListener(event, ok);
    video.addEventListener('error', fail);
  });
}

/**
 * Prepares an MP4 artwork: the video itself is uploaded as is, and a poster frame
 * (shortly after the start) is encoded like an image for thumbnails and loading.
 * Fails with a friendly message when this browser cannot decode the video.
 */
export async function prepareVideo(file: Blob, fileName = ''): Promise<PreparedImage> {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  try {
    const loaded = once(video, 'loadeddata');
    video.src = url;
    await loaded;
    if (!video.videoWidth || !video.videoHeight) throw new Error('no video track');
    const seeked = once(video, 'seeked');
    video.currentTime = Math.min(0.5, (video.duration || 1) / 3);
    await seeked;
    const full = await encode(video, FULL_MAX, 0.86);
    const thumbnail = await encode(video, THUMB_MAX, 0.8);
    return {
      full: full.blob,
      thumbnail: thumbnail.blob,
      width: full.width,
      height: full.height,
      suggestedTitle: titleFromFileName(fileName),
      video: file,
    };
  } catch (e) {
    throw new FriendlyError(t.errors.videoBroken, e);
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
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
