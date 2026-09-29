'use client';

import { useMemo } from 'react';
import { Instance, Instances, Stars } from '@react-three/drei';
import { ROOM_WIDTH, WALL_HEIGHT } from '@/lib/gallery/layout';
import { stepsAlong, type DecorProps } from './types';

/** Glowing jack-o'-lantern. */
function Pumpkin({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0.22 * s, z]} scale={s}>
      <mesh scale={[1, 0.78, 1]}>
        <sphereGeometry args={[0.3, 20, 14]} />
        <meshStandardMaterial
          color="#e0782d"
          emissive="#ff7a1a"
          emissiveIntensity={0.55}
          roughness={0.6}
        />
      </mesh>
      <mesh position={[0, 0.27, 0]}>
        <cylinderGeometry args={[0.03, 0.045, 0.12, 6]} />
        <meshStandardMaterial color="#3d5a1e" />
      </mesh>
    </group>
  );
}

/**
 * ハロウィンギャラリー: a moonlit night gallery. Violet walls, a huge moon, strings of
 * orange and violet bulbs (instanced) and glowing pumpkins in the corners.
 */
export function HalloweenDecor({ rooms, zStart, zEnd, midZ, length }: DecorProps) {
  const bulbs = useMemo(
    () =>
      stepsAlong(zStart - 0.3, zEnd, 0.6).flatMap((z, i) =>
        [-1, 1].map((side) => ({
          position: [
            side * (ROOM_WIDTH / 2 - 0.08),
            WALL_HEIGHT - 0.07 - Math.abs(Math.sin(i * 0.9)) * 0.05,
            z,
          ] as [number, number, number],
          orange: (i + (side > 0 ? 1 : 0)) % 2 === 0,
        })),
      ),
    [zStart, zEnd],
  );

  return (
    <>
      <group position={[0, 0, midZ]}>
        <Stars radius={70} depth={20} count={1200} factor={3} saturation={0} fade speed={0.3} />
      </group>
      {/* The moon */}
      <mesh position={[-8, 26, zEnd - 60]}>
        <sphereGeometry args={[7, 32, 24]} />
        <meshBasicMaterial color="#fff2c0" fog={false} />
      </mesh>
      {/* String lights */}
      {[true, false].map((orange) => (
        <Instances key={String(orange)} limit={bulbs.length}>
          <sphereGeometry args={[0.06, 10, 8]} />
          <meshStandardMaterial
            color={orange ? '#ffb45c' : '#c79bff'}
            emissive={orange ? '#ff8a2a' : '#a86bff'}
            emissiveIntensity={2}
          />
          {bulbs
            .filter((b) => b.orange === orange)
            .map((b, i) => (
              <Instance key={i} position={b.position} />
            ))}
        </Instances>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (ROOM_WIDTH / 2 - 0.08), WALL_HEIGHT - 0.07, midZ]}>
          <boxGeometry args={[0.01, 0.01, length]} />
          <meshBasicMaterial color="#111" />
        </mesh>
      ))}
      {/* Pumpkins in the corners of each room */}
      {rooms.flatMap((room) =>
        [room.zStart - 0.6, room.zEnd + 0.6].flatMap((z) =>
          [-1, 1].map((side) => (
            <group key={`${room.index}:${side}:${z}`}>
              <Pumpkin x={side * (ROOM_WIDTH / 2 - 0.55)} z={z} />
              <Pumpkin
                x={side * (ROOM_WIDTH / 2 - 0.95)}
                z={z + (z > (room.zStart + room.zEnd) / 2 ? -0.35 : 0.35)}
                s={0.65}
              />
            </group>
          )),
        ),
      )}
    </>
  );
}
