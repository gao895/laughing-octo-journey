'use client';

import { ROOM_WIDTH, WALL_HEIGHT } from '@/lib/gallery/layout';
import { roomCenter, type DecorProps } from './types';

/** 白い美術館: a bench in each room and ceiling light panels. */
export function MuseumDecor({ rooms, template, midZ }: DecorProps) {
  return (
    <>
      {rooms.map((room) => {
        const cz = roomCenter(room);
        const len = room.zStart - room.zEnd;
        return (
          <group key={room.index}>
            <mesh position={[0, 0.45, cz]}>
              <boxGeometry args={[0.6, 0.08, 2.2]} />
              <meshStandardMaterial color="#3a2f25" roughness={0.6} />
            </mesh>
            {[-0.9, 0.9].map((dz) => (
              <mesh key={dz} position={[0, 0.2, cz + dz]}>
                <boxGeometry args={[0.5, 0.4, 0.08]} />
                <meshStandardMaterial color="#222" />
              </mesh>
            ))}
            <mesh rotation-x={Math.PI / 2} position={[0, WALL_HEIGHT - 0.01, cz]}>
              <planeGeometry args={[1.4, len - 3]} />
              <meshStandardMaterial color="#ffffff" emissive="#fff6e6" emissiveIntensity={0.9} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, WALL_HEIGHT - 0.1, midZ]}>
        <boxGeometry args={[ROOM_WIDTH, 0.04, 0.04]} />
        <meshStandardMaterial color={template.accent} />
      </mesh>
    </>
  );
}
