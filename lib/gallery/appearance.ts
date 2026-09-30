import type { FrameStyle, GallerySettings } from '@/types/gallery';
import type { TemplateStyle } from './templates';
import { isBackdropId, type BackdropId } from './backdrops';

/**
 * Per-exhibition look (wall colour, frames, caption plates), stored in the
 * galleries.settings jsonb column. Values read from the database are validated
 * here before they reach the 3D scene.
 */

export interface FrameSpec {
  color: string;
  metalness: number;
  roughness: number;
  /** Border width in metres; 0 = no frame. */
  border: number;
  /** Self-illumination so the colour holds up in dim venues. */
  glow?: number;
}

export const FRAME_STYLES: Record<Exclude<FrameStyle, 'venue'>, FrameSpec> = {
  wood: { color: '#6b4a2f', metalness: 0, roughness: 0.75, border: 0.07 },
  // Low metalness: without environment reflections a metallic material renders dark.
  gold: { color: '#dcb458', metalness: 0.12, roughness: 0.4, border: 0.09, glow: 0.22 },
  white: { color: '#f2f0ea', metalness: 0, roughness: 0.6, border: 0.06 },
  black: { color: '#171717', metalness: 0.15, roughness: 0.5, border: 0.05 },
  none: { color: '#000000', metalness: 0, roughness: 1, border: 0 },
};

export const FRAME_STYLE_ORDER: FrameStyle[] = ['venue', 'wood', 'gold', 'white', 'black', 'none'];

/** Curated wall colours that flatter artworks. */
export const WALL_SWATCHES = [
  { id: 'white', color: '#f4f2ee' },
  { id: 'greige', color: '#d9d2c5' },
  { id: 'sage', color: '#b9c4b0' },
  { id: 'dustyBlue', color: '#aab8c6' },
  { id: 'terracotta', color: '#c98a6b' },
  { id: 'bordeaux', color: '#5c2a33' },
  { id: 'navy', color: '#1f2a44' },
  { id: 'charcoal', color: '#2e2e33' },
] as const;

const HEX = /^#[0-9a-f]{6}$/i;

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX.test(value);
}

function isFrameStyle(value: unknown): value is FrameStyle {
  return typeof value === 'string' && (FRAME_STYLE_ORDER as string[]).includes(value);
}

export interface Appearance {
  wallColor: string | null;
  frameStyle: FrameStyle;
  showCaptions: boolean;
  backdrop: BackdropId | null;
}

/** Validated appearance settings with defaults. */
export function readAppearance(settings: GallerySettings | null | undefined): Appearance {
  const s = settings ?? {};
  return {
    wallColor: isHexColor(s.wallColor) ? s.wallColor.toLowerCase() : null,
    frameStyle: isFrameStyle(s.frameStyle) ? s.frameStyle : 'venue',
    showCaptions: s.showCaptions !== false,
    backdrop: isBackdropId(s.backdrop) ? s.backdrop : null,
  };
}

/** Relative luminance (0 = black, 1 = white) of a '#rrggbb' colour. */
export function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** The venue with the exhibition's wall colour applied (title text flips for dark walls). */
export function applyAppearance(template: TemplateStyle, appearance: Appearance): TemplateStyle {
  if (!appearance.wallColor) return template;
  const dark = luminance(appearance.wallColor) < 0.18;
  return { ...template, wall: appearance.wallColor, text: dark ? '#f5f1e6' : '#26221e' };
}

export function frameFor(template: TemplateStyle, appearance: Appearance): FrameSpec {
  if (appearance.frameStyle === 'venue') {
    return { color: template.frame, metalness: 0.2, roughness: 0.5, border: 0.07 };
  }
  return FRAME_STYLES[appearance.frameStyle];
}
