'use client';

import { ROOM_WIDTH, WALL_HEIGHT } from '@/lib/gallery/layout';
import { roomCenter, type DecorProps } from './types';

/** シンプル展示室: nothing but a slim light line in the ceiling of each room and a shadow gap. */
export function SimpleDecor({ rooms, midZ, length }: DecorProps) {
  return (
    <>
      {rooms.map((room) => (
        <mesh
          key={room.index}
          rotation-x={Math.PI / 2}
          position={[0, WALL_HEIGHT - 0.01, roomCenter(room)]}
        >
          <planeGeometry args={[0.12, room.zStart - room.zEnd - 2]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
        </mesh>
      ))}
      {/* Shadow gap where the walls meet the ceiling */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (ROOM_WIDTH / 2 - 0.01), WALL_HEIGHT - 0.03, midZ]}>
          <boxGeometry args={[0.02, 0.05, length]} />
          <meshBasicMaterial color="#8d8d89" />
        </mesh>
      ))}
    </>
  );
}
