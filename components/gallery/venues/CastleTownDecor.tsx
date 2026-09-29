'use client';

import { useEffect, useMemo } from 'react';
import { ROOM_WIDTH, WALL_HEIGHT, DOOR_WIDTH } from '@/lib/gallery/layout';
import { namakoTexture } from '../textures';
import { roomCenter, stepsAlong, WALL_DECOR_DEPTH, type DecorProps } from './types';

const NAMAKO_HEIGHT = 0.8;

/** Red paper lantern (chōchin) hanging from the ceiling. */
function Chochin({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 3.05, z]}>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.5, 4]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh scale={[1, 1.35, 1]}>
        <sphereGeometry args={[0.22, 20, 16]} />
        <meshStandardMaterial color="#d8342a" emissive="#ff5a3c" emissiveIntensity={0.9} />
      </mesh>
      {[0.3, -0.3].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.05, 16]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}
    </group>
  );
}

/** Indigo shop curtain (noren) hung over each doorway; visitors walk through it. */
function Noren({ z }: { z: number }) {
  const panels = 3;
  const w = DOOR_WIDTH / panels;
  return (
    <group position={[0, 2.35, z]}>
      {Array.from({ length: panels }, (_, i) => (
        <mesh key={i} position={[-DOOR_WIDTH / 2 + w * (i + 0.5), 0, 0]}>
          <planeGeometry args={[w - 0.04, 0.7]} />
          <meshStandardMaterial color="#1f3a63" side={2} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * 城下町ギャラリー: a storehouse (kura) on a castle-town street. White plaster walls over a
 * namako-kabe band, stone paving, dark beams, red chōchin and noren at the doorways.
 */
export function CastleTownDecor({ rooms, template, zStart, zEnd, midZ, length }: DecorProps) {
  const namako = useMemo(() => {
    const tex = namakoTexture();
    tex.repeat.set(length / 0.4, NAMAKO_HEIGHT / 0.4);
    return tex;
  }, [length]);
  useEffect(() => () => namako.dispose(), [namako]);

  return (
    <>
      {/* Namako-kabe band along both side walls (flat, so artworks stay in front). */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (ROOM_WIDTH / 2 - WALL_DECOR_DEPTH / 2), NAMAKO_HEIGHT / 2, midZ]}
          rotation-y={-side * (Math.PI / 2)}
        >
          <planeGeometry args={[length, NAMAKO_HEIGHT]} />
          <meshStandardMaterial map={namako} roughness={0.7} />
        </mesh>
      ))}
      {/* Black roof-tile coping along the top of the walls */}
      {[-1, 1].map((side) => (
        <mesh
          key={`k${side}`}
          position={[side * (ROOM_WIDTH / 2 - 0.06), WALL_HEIGHT - 0.06, midZ]}
        >
          <boxGeometry args={[0.12, 0.12, length]} />
          <meshStandardMaterial color="#2b2d31" roughness={0.6} />
        </mesh>
      ))}
      {/* Exposed beams */}
      {stepsAlong(zStart - 1.2, zEnd, 2.4).map((z) => (
        <mesh key={z} position={[0, WALL_HEIGHT - 0.14, z]}>
          <boxGeometry args={[ROOM_WIDTH, 0.22, 0.22]} />
          <meshStandardMaterial color={template.accent} roughness={0.8} />
        </mesh>
      ))}
      {rooms.map((room) => {
        const cz = roomCenter(room);
        const half = (room.zStart - room.zEnd) / 4;
        return (
          <group key={room.index}>
            <Chochin x={-1.9} z={cz + half} />
            <Chochin x={1.9} z={cz + half} />
            <Chochin x={-1.9} z={cz - half} />
            <Chochin x={1.9} z={cz - half} />
          </group>
        );
      })}
      {rooms.slice(1).map((room) => (
        <Noren key={room.index} z={room.zStart} />
      ))}
      <Noren z={zStart - 0.15} />
    </>
  );
}
