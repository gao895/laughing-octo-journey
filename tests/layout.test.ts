import { describe, expect, it } from 'vitest';
import {
  canStandAt,
  clampPlacement,
  computeLayout,
  nudgePlacement,
  resolvePlacements,
  ROOM_WIDTH,
  WALL_HEIGHT,
  artworkSize,
} from '@/lib/gallery/layout';

const art = (i: number, width = 1200, height = 800) => ({ id: `a${i}`, width, height });
const many = (n: number) => Array.from({ length: n }, (_, i) => art(i));

describe('computeLayout', () => {
  it('creates one room for an empty gallery', () => {
    const layout = computeLayout([]);
    expect(layout.rooms).toHaveLength(1);
    expect(layout.placements).toHaveLength(0);
    expect(canStandAt(layout.spawn.x, layout.spawn.z, layout)).toBe(true);
  });

  it('alternates left and right walls pair by pair', () => {
    const { placements } = computeLayout(many(4));
    const [p1, p2, p3, p4] = placements;
    expect(p1!.x).toBeLessThan(0);
    expect(p2!.x).toBeGreaterThan(0);
    expect(p3!.x).toBeLessThan(0);
    expect(p4!.x).toBeGreaterThan(0);
    // 1 & 2 face each other, 3 & 4 are further down the corridor.
    expect(p1!.z).toBeCloseTo(p2!.z);
    expect(p3!.z).toBeLessThan(p1!.z);
    expect(p1!.rotationY).toBeCloseTo(Math.PI / 2);
    expect(p2!.rotationY).toBeCloseTo(-Math.PI / 2);
  });

  it('generates the next room automatically when there are many artworks', () => {
    const layout = computeLayout(many(25));
    expect(layout.rooms.length).toBeGreaterThan(1);
    expect(layout.colliders.length).toBe((layout.rooms.length - 1) * 2);
    for (const p of layout.placements) {
      expect(p.z).toBeLessThanOrEqual(layout.rooms[0]!.zStart);
      expect(p.z).toBeGreaterThanOrEqual(layout.rooms.at(-1)!.zEnd);
    }
  });

  it('shrinks artworks as the exhibition grows and keeps them on the wall', () => {
    const small = computeLayout(many(2)).placements[0]!.scale;
    const big = computeLayout(many(12)).placements[0]!.scale;
    expect(big).toBeLessThan(small);
    for (const p of computeLayout([art(0, 400, 1600), ...many(5)]).placements) {
      const { h } = artworkSize(p.id === 'a0' ? 400 : 1200, p.id === 'a0' ? 1600 : 800, p.scale);
      expect(p.y + h / 2).toBeLessThanOrEqual(WALL_HEIGHT);
      expect(p.y - h / 2).toBeGreaterThan(0);
    }
  });

  it('uses bigger artworks in large mode and equal sizes in even mode', () => {
    const large = computeLayout(many(4), 'large').placements[0]!.scale;
    const auto = computeLayout(many(4), 'auto').placements[0]!.scale;
    expect(large).toBeGreaterThan(auto);
    const even = computeLayout([art(0), art(1, 800, 1200)], 'even').placements;
    expect(even[0]!.scale).toBe(even[1]!.scale);
  });
});

describe('resolvePlacements', () => {
  const base = {
    position_x: null,
    position_y: null,
    position_z: null,
    rotation_y: null,
    scale: null,
  };
  it('ignores stored positions unless the mode is manual', () => {
    const arts = [{ ...art(0), ...base, position_x: 1, position_y: 2, position_z: -3, scale: 1 }];
    expect(resolvePlacements(arts, 'auto').placements[0]!.x).not.toBe(1);
    expect(resolvePlacements(arts, 'manual').placements[0]).toMatchObject({
      x: 1,
      y: 2,
      z: -3,
      scale: 1,
    });
  });
  it('falls back to the automatic slot for artworks never positioned', () => {
    const arts = [{ ...art(0), ...base }];
    expect(resolvePlacements(arts, 'manual').placements[0]).toEqual(
      computeLayout(arts).placements[0],
    );
  });
});

describe('nudgePlacement', () => {
  const layout = computeLayout(many(4));
  const left = layout.placements[0]!;
  const a = { width: 1200, height: 800 };

  it('moves right along the wall as seen by a visitor facing the artwork', () => {
    // Facing the left wall (looking towards -X), "right" is towards -Z.
    const moved = nudgePlacement(left, 'right', a, layout);
    expect(moved.z).toBeLessThan(left.z);
    expect(moved.x).toBeCloseTo(left.x);
  });

  it('grows / shrinks and never leaves the wall', () => {
    let p = left;
    for (let i = 0; i < 30; i++) p = nudgePlacement(p, 'bigger', a, layout);
    expect(artworkSize(a.width, a.height, p.scale).h).toBeLessThanOrEqual(WALL_HEIGHT);
    for (let i = 0; i < 60; i++) p = nudgePlacement(p, 'up', a, layout);
    expect(p.y).toBeLessThanOrEqual(WALL_HEIGHT);
    for (let i = 0; i < 200; i++) p = nudgePlacement(p, 'left', a, layout);
    expect(p.z).toBeLessThanOrEqual(layout.rooms[0]!.zStart);
    expect(nudgePlacement(left, 'smaller', a, layout).scale).toBeLessThan(left.scale);
  });

  it('clampPlacement keeps back-wall artworks within the room width', () => {
    const p = clampPlacement({ id: 'x', x: 100, y: 1.6, z: -5, rotationY: 0, scale: 1 }, a, layout);
    expect(p.x).toBeLessThan(ROOM_WIDTH / 2);
  });
});

describe('canStandAt', () => {
  it('blocks walls but lets visitors through the doorway', () => {
    const layout = computeLayout(many(25));
    const doorZ = layout.rooms[1]!.zStart;
    expect(canStandAt(0, doorZ, layout)).toBe(true);
    expect(canStandAt(3, doorZ, layout)).toBe(false);
    expect(canStandAt(ROOM_WIDTH, -2, layout)).toBe(false);
  });
});
