'use client';

import { useEffect, useMemo } from 'react';
import type { Texture } from 'three';
import type { GalleryLayout } from '@/lib/gallery/layout';
import { DOOR_WIDTH, ROOM_WIDTH, WALL_HEIGHT } from '@/lib/gallery/layout';
import type { TemplateStyle } from '@/lib/gallery/templates';
import { floorTexture } from './textures';
import { VENUE_DECOR } from './venues';

const T = 0.2; // wall thickness

interface RoomProps {
  layout: GalleryLayout;
  template: TemplateStyle;
}

/** Floor, walls, ceiling and template-specific decorations. */
export function GalleryRoom({ layout, template }: RoomProps) {
  const first = layout.rooms[0]!;
  const last = layout.rooms[layout.rooms.length - 1]!;
  const length = first.zStart - last.zEnd;
  const midZ = (first.zStart + last.zEnd) / 2;
  const Decor = VENUE_DECOR[template.id];

  const floorMap = useMemo<Texture | null>(() => {
    if (!template.floorPattern) return null;
    const tile = template.floorPattern === 'tatami' ? 1.8 : 2;
    const texture = floorTexture(template.floorPattern, template.floor);
    texture.repeat.set(ROOM_WIDTH / tile, length / tile);
    return texture;
  }, [template.floorPattern, template.floor, length]);

  useEffect(() => () => floorMap?.dispose(), [floorMap]);

  return (
    <group>
      {/* Floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, midZ]}>
        <planeGeometry args={[ROOM_WIDTH + T * 2, length + T * 2]} />
        <meshStandardMaterial
          color={floorMap ? '#ffffff' : template.floor}
          map={floorMap}
          roughness={template.floorRoughness}
          metalness={template.floorMetalness}
        />
      </mesh>

      {/* Ceiling (open-sky venues show the sky instead) */}
      {!template.openSky && (
        <mesh rotation-x={Math.PI / 2} position={[0, WALL_HEIGHT, midZ]}>
          <planeGeometry args={[ROOM_WIDTH + T * 2, length + T * 2]} />
          <meshStandardMaterial color={template.ceiling} roughness={1} />
        </mesh>
      )}

      {/* Side walls */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (ROOM_WIDTH / 2 + T / 2), WALL_HEIGHT / 2, midZ]}>
          <boxGeometry args={[T, WALL_HEIGHT, length + T * 2]} />
          <meshStandardMaterial color={template.wall} roughness={0.95} />
        </mesh>
      ))}

      {/* Baseboards */}
      {[-1, 1].map((side) => (
        <mesh key={`b${side}`} position={[side * (ROOM_WIDTH / 2 - 0.02), 0.06, midZ]}>
          <boxGeometry args={[0.04, 0.12, length]} />
          <meshStandardMaterial color={template.accent} />
        </mesh>
      ))}

      {/* End walls */}
      <EndWall z={first.zStart + T / 2} template={template} />
      <EndWall z={last.zEnd - T / 2} template={template} />

      {/* Partitions with a doorway: "次の部屋" */}
      {layout.rooms.slice(1).map((room) => (
        <Partition key={room.index} z={room.zStart} template={template} />
      ))}

      <Decor
        rooms={layout.rooms}
        template={template}
        zStart={first.zStart}
        zEnd={last.zEnd}
        midZ={midZ}
        length={length}
      />
    </group>
  );
}

function EndWall({ z, template }: { z: number; template: TemplateStyle }) {
  return (
    <mesh position={[0, WALL_HEIGHT / 2, z]}>
      <boxGeometry args={[ROOM_WIDTH + T * 2, WALL_HEIGHT, T]} />
      <meshStandardMaterial color={template.wall} roughness={0.95} />
    </mesh>
  );
}

function Partition({ z, template }: { z: number; template: TemplateStyle }) {
  const sideWidth = (ROOM_WIDTH - DOOR_WIDTH) / 2;
  const doorHeight = 2.7;
  return (
    <group position={[0, 0, z]}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (DOOR_WIDTH / 2 + sideWidth / 2), WALL_HEIGHT / 2, 0]}>
          <boxGeometry args={[sideWidth, WALL_HEIGHT, T]} />
          <meshStandardMaterial color={template.wall} roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, (WALL_HEIGHT + doorHeight) / 2, 0]}>
        <boxGeometry args={[DOOR_WIDTH, WALL_HEIGHT - doorHeight, T]} />
        <meshStandardMaterial color={template.wall} roughness={0.95} />
      </mesh>
      {/* Door frame */}
      {[-1, 1].map((side) => (
        <mesh key={`f${side}`} position={[side * (DOOR_WIDTH / 2), doorHeight / 2, 0]}>
          <boxGeometry args={[0.08, doorHeight, T + 0.04]} />
          <meshStandardMaterial color={template.accent} />
        </mesh>
      ))}
    </group>
  );
}
