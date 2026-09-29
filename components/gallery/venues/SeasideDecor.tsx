'use client';

import { useMemo } from 'react';
import { ROOM_WIDTH, WALL_HEIGHT } from '@/lib/gallery/layout';
import { stepsAlong, WALL_DECOR_DEPTH, type DecorProps } from './types';

function Cloud({ position, scale }: { position: [number, number, number]; scale: number }) {
  return (
    <group position={position} scale={scale}>
      {[
        [0, 0, 0, 2.2],
        [2, -0.3, 0.4, 1.6],
        [-2.1, -0.4, -0.2, 1.5],
        [0.8, 0.9, -0.3, 1.4],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x!, y!, z!]}>
          <sphereGeometry args={[r!, 16, 12]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.35}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Lifebuoy: white ring with four red bands. */
function Lifebuoy({
  position,
  rotationY,
}: {
  position: [number, number, number];
  rotationY: number;
}) {
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh>
        <torusGeometry args={[0.32, 0.09, 12, 32]} />
        <meshStandardMaterial color="#fbfbf8" />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} rotation-z={(i * Math.PI) / 2 + Math.PI / 4}>
          <torusGeometry args={[0.32, 0.095, 12, 8, Math.PI / 6]} />
          <meshStandardMaterial color="#d8412f" />
        </mesh>
      ))}
    </group>
  );
}

/** Striped beach parasol: alternating segments around a white pole. */
function Parasol({ x, z, color }: { x: number; z: number; color: string }) {
  const segments = 8;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 2.3, 8]} />
        <meshStandardMaterial color="#fbfbf8" />
      </mesh>
      {Array.from({ length: segments }, (_, i) => (
        <mesh key={i} position={[0, 2.3, 0]}>
          <coneGeometry
            args={[1.1, 0.4, 3, 1, true, (i * Math.PI * 2) / segments, (Math.PI * 2) / segments]}
          />
          <meshStandardMaterial color={i % 2 ? '#fbfbf8' : color} side={2} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * 海辺のギャラリー: a whitewashed boathouse open to a summer sky. Deck floor, marine
 * stripes, rope trim, lifebuoys, a low sun over the title wall and drifting clouds.
 */
export function SeasideDecor({ rooms, template, zStart, zEnd, midZ, length }: DecorProps) {
  const clouds = useMemo(
    () =>
      stepsAlong(zStart - 4, zEnd - 30, 11).map((z, i) => ({
        position: [(i % 2 ? 1 : -1) * (10 + (i % 3) * 6), 14 + (i % 3) * 3, z] as [
          number,
          number,
          number,
        ],
        scale: 1 + (i % 3) * 0.4,
      })),
    [zStart, zEnd],
  );

  return (
    <>
      {/* Marine stripes: a thin navy line over a wide blue band, flat on the wall */}
      {[-1, 1].map((side) =>
        [
          { y: 0.35, h: 0.5, color: template.accent },
          { y: 0.72, h: 0.06, color: '#1f4e79' },
        ].map((band) => (
          <mesh
            key={`${side}:${band.y}`}
            position={[side * (ROOM_WIDTH / 2 - WALL_DECOR_DEPTH / 2), band.y, midZ]}
            rotation-y={-side * (Math.PI / 2)}
          >
            <planeGeometry args={[length, band.h]} />
            <meshStandardMaterial color={band.color} />
          </mesh>
        )),
      )}
      {/* Rope trim along the top of the walls */}
      {[-1, 1].map((side) => (
        <mesh
          key={`r${side}`}
          position={[side * (ROOM_WIDTH / 2 - 0.045), WALL_HEIGHT - 0.055, midZ]}
          rotation-x={Math.PI / 2}
        >
          <cylinderGeometry args={[0.045, 0.045, length, 8]} />
          <meshStandardMaterial color="#b89565" roughness={1} />
        </mesh>
      ))}
      {/* Lifebuoys on the entrance wall and beside each doorway */}
      <Lifebuoy position={[-2.6, 2.2, zStart - 0.14]} rotationY={Math.PI} />
      <Lifebuoy position={[2.6, 2.2, zStart - 0.14]} rotationY={Math.PI} />
      {rooms.slice(1).map((room) => (
        <Lifebuoy key={room.index} position={[-2.4, 2.1, room.zStart + 0.2]} rotationY={0} />
      ))}
      {/* Beach parasols in the room corners, out of the walking path */}
      {rooms.flatMap((room) =>
        [room.zStart - 1, room.zEnd + 1].map((z, i) => (
          <Parasol
            key={`${room.index}:${z}`}
            x={(i === 0 ? -1 : 1) * (ROOM_WIDTH / 2 - 1.1)}
            z={z}
            color={i === 0 ? template.accent : '#f3c64b'}
          />
        )),
      )}
      {/* Low sun ahead and clouds */}
      <mesh position={[6, 22, zEnd - 90]}>
        <sphereGeometry args={[6, 24, 16]} />
        <meshBasicMaterial color="#fff3b0" fog={false} toneMapped={false} />
      </mesh>
      {clouds.map((c, i) => (
        <Cloud key={i} position={c.position} scale={c.scale} />
      ))}
      {/* Sea all around */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.3, midZ]}>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#2f82b8" roughness={0.3} metalness={0.2} />
      </mesh>
    </>
  );
}
