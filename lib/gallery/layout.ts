import type { LayoutMode } from '@/types/gallery';

/**
 * Automatic exhibition layout.
 *
 * The venue is a corridor running along -Z. Artworks are hung alternately on the
 * left and right walls, pair by pair:
 *
 *     [1]      [2]
 *     [3]      [4]
 *
 * When there are too many artworks for one room, the next room is generated
 * automatically behind a partition wall with a doorway.
 *
 * Everything here is pure so it can be unit-tested and reused on the server
 * (e.g. by a future AI layout suggestion).
 */

export const WALL_HEIGHT = 4;
export const ROOM_WIDTH = 9;
export const EYE_HEIGHT = 1.6;
export const DOOR_WIDTH = 2.6;
export const ROOM_MARGIN = 2;
export const WALL_OFFSET = 0.03;
const MIN_ROOM_LENGTH = 10;
const PARTITION_THICKNESS = 0.2;
const MAX_SCALE = 3.5;
const MIN_SCALE = 0.4;

export interface LayoutInput {
  id: string;
  width: number;
  height: number;
}

export interface StoredPlacement {
  position_x: number | null;
  position_y: number | null;
  position_z: number | null;
  rotation_y: number | null;
  scale: number | null;
}

export interface ArtworkPlacement {
  id: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  /** Length of the longer side in metres. */
  scale: number;
}

export interface RoomSpec {
  index: number;
  /** Near end of the room (larger Z). */
  zStart: number;
  /** Far end of the room (smaller Z). */
  zEnd: number;
  width: number;
}

export interface Box {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface GalleryLayout {
  rooms: RoomSpec[];
  placements: ArtworkPlacement[];
  /** Walkable area. */
  bounds: Box;
  /** Obstacles inside the walkable area (partition walls). */
  colliders: Box[];
  spawn: { x: number; z: number; yaw: number };
}

interface ModeConfig {
  pairsPerRoom: number;
  slot: number;
  size: (count: number) => number;
}

const MODES: Record<Exclude<LayoutMode, 'manual'>, ModeConfig> = {
  auto: {
    pairsPerRoom: 5,
    slot: 3.4,
    size: (count) => (count <= 4 ? 2.2 : count <= 8 ? 1.9 : 1.6),
  },
  even: { pairsPerRoom: 6, slot: 3, size: () => 1.6 },
  large: { pairsPerRoom: 3, slot: 4.6, size: () => 2.8 },
};

function modeConfig(mode: LayoutMode): ModeConfig {
  return MODES[mode === 'manual' ? 'auto' : mode];
}

/** Width/height in metres for an artwork shown with the given long-side scale. */
export function artworkSize(
  width: number,
  height: number,
  scale: number,
): { w: number; h: number } {
  const safeW = width > 0 ? width : 1;
  const safeH = height > 0 ? height : 1;
  if (safeW >= safeH) return { w: scale, h: (scale * safeH) / safeW };
  return { w: (scale * safeW) / safeH, h: scale };
}

function hangingHeight(h: number): number {
  return Math.min(Math.max(EYE_HEIGHT, h / 2 + 0.45), WALL_HEIGHT - h / 2 - 0.15);
}

export function computeLayout(artworks: LayoutInput[], mode: LayoutMode = 'auto'): GalleryLayout {
  const config = modeConfig(mode);
  const perRoom = config.pairsPerRoom * 2;
  const roomCount = Math.max(1, Math.ceil(artworks.length / perRoom));
  const baseSize = config.size(artworks.length);

  const rooms: RoomSpec[] = [];
  let cursor = 0;
  for (let r = 0; r < roomCount; r++) {
    const inRoom = Math.min(perRoom, artworks.length - r * perRoom);
    const pairs = Math.max(1, Math.ceil(Math.max(inRoom, 0) / 2));
    const length = Math.max(MIN_ROOM_LENGTH, pairs * config.slot + ROOM_MARGIN * 2);
    rooms.push({ index: r, zStart: cursor, zEnd: cursor - length, width: ROOM_WIDTH });
    cursor -= length;
  }

  const placements: ArtworkPlacement[] = artworks.map((art, i) => {
    const room = rooms[Math.floor(i / perRoom)] ?? rooms[rooms.length - 1]!;
    const local = i % perRoom;
    const pair = Math.floor(local / 2);
    const isLeft = local % 2 === 0;
    const inRoom = Math.min(perRoom, artworks.length - room.index * perRoom);
    const pairs = Math.ceil(inRoom / 2);
    // Centre the pairs inside the room.
    const usable = room.zStart - room.zEnd - ROOM_MARGIN * 2;
    const slot = usable / Math.max(pairs, 1);
    const z = room.zStart - ROOM_MARGIN - slot * (pair + 0.5);

    // Keep very tall images from touching the ceiling.
    const aspect = art.height / Math.max(art.width, 1);
    const scale = aspect > 1 ? Math.min(baseSize, WALL_HEIGHT - 1.2) : baseSize;
    const { h } = artworkSize(art.width, art.height, scale);

    return {
      id: art.id,
      x: isLeft ? -ROOM_WIDTH / 2 + WALL_OFFSET : ROOM_WIDTH / 2 - WALL_OFFSET,
      y: hangingHeight(h),
      z,
      rotationY: isLeft ? Math.PI / 2 : -Math.PI / 2,
      scale,
    };
  });

  const last = rooms[rooms.length - 1]!;
  const inset = 0.6;
  const bounds: Box = {
    minX: -ROOM_WIDTH / 2 + inset,
    maxX: ROOM_WIDTH / 2 - inset,
    minZ: last.zEnd + inset,
    maxZ: rooms[0]!.zStart - inset,
  };

  // Partition walls between rooms, leaving a doorway in the middle.
  const colliders: Box[] = [];
  for (let r = 1; r < rooms.length; r++) {
    const z = rooms[r]!.zStart;
    const half = PARTITION_THICKNESS / 2 + 0.35;
    colliders.push(
      { minX: -ROOM_WIDTH / 2, maxX: -DOOR_WIDTH / 2 + 0.2, minZ: z - half, maxZ: z + half },
      { minX: DOOR_WIDTH / 2 - 0.2, maxX: ROOM_WIDTH / 2, minZ: z - half, maxZ: z + half },
    );
  }

  return { rooms, placements, bounds, colliders, spawn: { x: 0, z: -1.2, yaw: 0 } };
}

/**
 * Final placements for rendering. In "manual" mode, positions saved by the user win;
 * artworks that were never positioned fall back to the automatic slot.
 */
export function resolvePlacements(
  artworks: (LayoutInput & StoredPlacement)[],
  mode: LayoutMode,
): GalleryLayout {
  const layout = computeLayout(artworks, mode);
  if (mode !== 'manual') return layout;
  const placements = layout.placements.map((auto, i) => {
    const a = artworks[i]!;
    if (a.position_x == null || a.position_y == null || a.position_z == null) return auto;
    return {
      id: a.id,
      x: a.position_x,
      y: a.position_y,
      z: a.position_z,
      rotationY: a.rotation_y ?? auto.rotationY,
      scale: a.scale ?? auto.scale,
    };
  });
  return { ...layout, placements };
}

/** A comfortable standing point in front of an artwork, facing it. */
export function viewpointFor(
  p: ArtworkPlacement,
  layout: Pick<GalleryLayout, 'bounds'>,
): { x: number; z: number; yaw: number } {
  const distance = Math.max(2.4, p.scale * 1.5);
  const { bounds } = layout;
  return {
    x: clamp(p.x + Math.sin(p.rotationY) * distance, bounds.minX, bounds.maxX),
    z: clamp(p.z + Math.cos(p.rotationY) * distance, bounds.minZ, bounds.maxZ),
    yaw: p.rotationY,
  };
}

export type NudgeAction = 'bigger' | 'smaller' | 'left' | 'right' | 'up' | 'down';

const MOVE_STEP = 0.3;
const LIFT_STEP = 0.15;

/**
 * Beginner-friendly adjustments ("大きくする", "左へ" …) instead of raw XYZ input.
 * Left/right are relative to a visitor facing the artwork.
 */
export function nudgePlacement(
  placement: ArtworkPlacement,
  action: NudgeAction,
  art: { width: number; height: number },
  layout: GalleryLayout,
): ArtworkPlacement {
  const next = { ...placement };
  // Local +X axis of the artwork in world space ("right" as seen by the viewer).
  const tx = Math.cos(placement.rotationY);
  const tz = -Math.sin(placement.rotationY);

  switch (action) {
    case 'bigger':
      next.scale = Math.min(MAX_SCALE, placement.scale * 1.15);
      break;
    case 'smaller':
      next.scale = Math.max(MIN_SCALE, placement.scale / 1.15);
      break;
    case 'left':
      next.x -= tx * MOVE_STEP;
      next.z -= tz * MOVE_STEP;
      break;
    case 'right':
      next.x += tx * MOVE_STEP;
      next.z += tz * MOVE_STEP;
      break;
    case 'up':
      next.y += LIFT_STEP;
      break;
    case 'down':
      next.y -= LIFT_STEP;
      break;
  }
  return clampPlacement(next, art, layout);
}

/** Keeps an artwork on its wall and inside the building. */
export function clampPlacement(
  p: ArtworkPlacement,
  art: { width: number; height: number },
  layout: GalleryLayout,
): ArtworkPlacement {
  let { w, h } = artworkSize(art.width, art.height, p.scale);
  let scale = p.scale;
  const maxH = WALL_HEIGHT - 0.4;
  if (h > maxH) {
    scale = (scale * maxH) / h;
    ({ w, h } = artworkSize(art.width, art.height, scale));
  }
  const y = clamp(p.y, h / 2 + 0.2, WALL_HEIGHT - h / 2 - 0.1);
  const first = layout.rooms[0]!;
  const last = layout.rooms[layout.rooms.length - 1]!;
  const halfW = w / 2 + 0.2;
  const onSideWall = Math.abs(Math.abs(p.rotationY) - Math.PI / 2) < 0.01;
  const x = onSideWall ? p.x : clamp(p.x, -ROOM_WIDTH / 2 + halfW, ROOM_WIDTH / 2 - halfW);
  const z = onSideWall ? clamp(p.z, last.zEnd + halfW, first.zStart - halfW) : p.z;
  return { ...p, x, y, z, scale };
}

function clamp(v: number, min: number, max: number): number {
  if (min > max) return (min + max) / 2;
  return Math.min(max, Math.max(min, v));
}

/** Movement helper shared by keyboard and joystick controls. */
export function canStandAt(
  x: number,
  z: number,
  layout: Pick<GalleryLayout, 'bounds' | 'colliders'>,
): boolean {
  const { bounds, colliders } = layout;
  if (x < bounds.minX || x > bounds.maxX || z < bounds.minZ || z > bounds.maxZ) return false;
  return !colliders.some((c) => x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ);
}
