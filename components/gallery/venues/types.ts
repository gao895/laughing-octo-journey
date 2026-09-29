import type { RoomSpec } from '@/lib/gallery/layout';
import type { TemplateStyle } from '@/lib/gallery/templates';

export interface DecorProps {
  rooms: RoomSpec[];
  template: TemplateStyle;
  /** Near end of the first room (entrance wall). */
  zStart: number;
  /** Far end of the last room (title wall). */
  zEnd: number;
  midZ: number;
  length: number;
}

export function roomCenter(room: RoomSpec): number {
  return (room.zStart + room.zEnd) / 2;
}

/** Every `step` metres from `from` down to `to` (Z decreases along the corridor). */
export function stepsAlong(from: number, to: number, step: number): number[] {
  const out: number[] = [];
  for (let z = from; z > to; z -= step) out.push(z);
  return out;
}

/**
 * Anything fixed to a side wall must stay within this distance of the wall surface
 * so it never covers the artworks (which hang 3 cm in front of the wall).
 */
export const WALL_DECOR_DEPTH = 0.015;
