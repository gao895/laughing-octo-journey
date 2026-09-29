'use client';

import { ROOM_WIDTH, WALL_HEIGHT } from '@/lib/gallery/layout';
import type { TemplateStyle } from '@/lib/gallery/templates';
import { stepsAlong, WALL_DECOR_DEPTH, type DecorProps } from './types';

function Shoji({ z, facing, template }: { z: number; facing: 1 | -1; template: TemplateStyle }) {
  const width = ROOM_WIDTH - 1;
  const height = 2.6;
  const cols = 8;
  const rows = 6;
  return (
    <group position={[0, 0.3 + height / 2, z + facing * 0.12]}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          color="#fff8ea"
          emissive="#ffe7c2"
          emissiveIntensity={0.45}
          side={2}
        />
      </mesh>
      {Array.from({ length: cols + 1 }, (_, i) => (
        <mesh key={`c${i}`} position={[-width / 2 + (width / cols) * i, 0, facing * 0.02]}>
          <boxGeometry args={[0.05, height, 0.03]} />
          <meshStandardMaterial color={template.accent} />
        </mesh>
      ))}
      {Array.from({ length: rows + 1 }, (_, i) => (
        <mesh key={`r${i}`} position={[0, -height / 2 + (height / rows) * i, facing * 0.02]}>
          <boxGeometry args={[width, 0.05, 0.03]} />
          <meshStandardMaterial color={template.accent} />
        </mesh>
      ))}
    </group>
  );
}

/** Paper lantern on the floor. */
export function Andon({ x, z, base }: { x: number; z: number; base: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.35, 0.7, 0.35]} />
        <meshStandardMaterial color="#fff4de" emissive="#ffc77a" emissiveIntensity={1.1} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.42, 0.12, 0.42]} />
        <meshStandardMaterial color={base} />
      </mesh>
    </group>
  );
}

/** 和風ギャラリー: shoji at the entrance, ceiling beams, nageshi rail, andon in the corners. */
export function JapaneseDecor({ rooms, template, zStart, zEnd, midZ, length }: DecorProps) {
  return (
    <>
      <Shoji z={zStart} facing={-1} template={template} />
      {stepsAlong(zStart - 1.5, zEnd, 3).map((z) => (
        <mesh key={z} position={[0, WALL_HEIGHT - 0.12, z]}>
          <boxGeometry args={[ROOM_WIDTH, 0.18, 0.18]} />
          <meshStandardMaterial color={template.accent} roughness={0.7} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        // Thin enough (see WALL_DECOR_DEPTH) to pass behind tall artworks.
        <mesh key={side} position={[side * (ROOM_WIDTH / 2 - WALL_DECOR_DEPTH / 2), 3.2, midZ]}>
          <boxGeometry args={[WALL_DECOR_DEPTH, 0.12, length]} />
          <meshStandardMaterial color={template.accent} />
        </mesh>
      ))}
      {rooms.flatMap((room) =>
        [room.zStart - 0.7, room.zEnd + 0.7].flatMap((z) =>
          [-1, 1].map((side) => (
            <Andon
              key={`${room.index}:${side}:${z}`}
              x={side * (ROOM_WIDTH / 2 - 0.5)}
              z={z}
              base={template.accent}
            />
          )),
        ),
      )}
    </>
  );
}
