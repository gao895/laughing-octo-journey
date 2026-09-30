/**
 * Real-photo 360° backdrops (Poly Haven, CC0 — see public/backdrops/CREDITS.md).
 * Choosing one turns the venue into an open-air exhibition: no walls or ceiling,
 * artworks on freestanding panels, and the photo lights the scene.
 */
export const BACKDROP_IDS = ['meadow', 'canal', 'waterside', 'beach', 'night'] as const;
export type BackdropId = (typeof BACKDROP_IDS)[number];

export interface BackdropSpec {
  id: BackdropId;
  /** How strongly the photo lights the scene (image-based lighting). */
  environmentIntensity: number;
  /** Strength of the directional "sun" that gives artworks and panels some shape. */
  sun: number;
  /**
   * Project the photo onto the ground so it stays put while walking. Only for open,
   * flat scenery: nearby buildings would be smeared across the ground.
   */
  grounded: boolean;
  /** Rotation (radians) so the most interesting view is ahead of the entrance. */
  rotationY: number;
}

export const BACKDROPS: Record<BackdropId, BackdropSpec> = {
  meadow: { id: 'meadow', environmentIntensity: 0.9, sun: 0.9, grounded: true, rotationY: 0.6 },
  canal: { id: 'canal', environmentIntensity: 0.9, sun: 0.8, grounded: false, rotationY: 0 },
  waterside: { id: 'waterside', environmentIntensity: 1, sun: 0.7, grounded: true, rotationY: 0 },
  beach: { id: 'beach', environmentIntensity: 0.9, sun: 0.8, grounded: true, rotationY: 0 },
  night: { id: 'night', environmentIntensity: 0.6, sun: 0.2, grounded: true, rotationY: 0 },
};

export function isBackdropId(value: unknown): value is BackdropId {
  return typeof value === 'string' && (BACKDROP_IDS as readonly string[]).includes(value);
}

/**
 * Static files live in public/. The single-file browser build serves them next to
 * the page, so it sets NEXT_PUBLIC_ASSET_BASE to '' (relative URLs).
 */
const ASSET_BASE = process.env.NEXT_PUBLIC_ASSET_BASE ?? '/';

export function backdropUrl(id: BackdropId): string {
  return `${ASSET_BASE}backdrops/${id}.jpg`;
}

export function backdropThumbUrl(id: BackdropId): string {
  return `${ASSET_BASE}backdrops/${id}-thumb.jpg`;
}
