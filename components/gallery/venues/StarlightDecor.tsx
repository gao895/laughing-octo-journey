'use client';

import { Stars } from '@react-three/drei';
import { ROOM_WIDTH, WALL_HEIGHT } from '@/lib/gallery/layout';
import { roomCenter, type DecorProps } from './types';

/** 星空ギャラリー: open to a starry sky, floating lights and glowing trims. */
export function StarlightDecor({ rooms, midZ, length }: DecorProps) {
  return (
    <>
      <group position={[0, 0, midZ]}>
        <Stars radius={60} depth={30} count={2500} factor={3} saturation={0.4} fade speed={0.6} />
      </group>
      {rooms.map((room) => {
        const cz = roomCenter(room);
        return (
          <group key={room.index}>
            {[-2.5, 0, 2.5].map((dz, i) => (
              <mesh
                key={dz}
                position={[i === 1 ? 0 : i === 0 ? -1.4 : 1.4, 3.1 + (i % 2) * 0.3, cz + dz]}
              >
                <sphereGeometry args={[0.12, 16, 16]} />
                <meshStandardMaterial color="#ffffff" emissive="#b8c4ff" emissiveIntensity={2.5} />
              </mesh>
            ))}
          </group>
        );
      })}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (ROOM_WIDTH / 2 - 0.03), WALL_HEIGHT - 0.05, midZ]}>
          <boxGeometry args={[0.04, 0.04, length]} />
          <meshStandardMaterial color="#9aa8ff" emissive="#9aa8ff" emissiveIntensity={1.2} />
        </mesh>
      ))}
    </>
  );
}
