'use client';

import { useEffect, useMemo } from 'react';
import { Stars } from '@react-three/drei';
import type { Texture } from 'three';
import type { GalleryLayout, RoomSpec } from '@/lib/gallery/layout';
import { DOOR_WIDTH, ROOM_WIDTH, WALL_HEIGHT } from '@/lib/gallery/layout';
import type { TemplateStyle } from '@/lib/gallery/templates';
import { starFloorTexture, tatamiTexture, woodTexture } from './textures';

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
  const id = template.id;

  const floorMap = useMemo<Texture | null>(() => {
    const tile = id === 'japanese' ? 1.8 : 2;
    const texture =
      id === 'white-museum'
        ? woodTexture(template.floor)
        : id === 'japanese'
          ? tatamiTexture(template.floor)
          : id === 'starlight'
            ? starFloorTexture(template.floor)
            : null;
    texture?.repeat.set(ROOM_WIDTH / tile, length / tile);
    return texture;
  }, [id, template.floor, length]);

  useEffect(() => () => floorMap?.dispose(), [floorMap]);

  return (
    <group>
      {/* Floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, midZ]}>
        <planeGeometry args={[ROOM_WIDTH + T * 2, length + T * 2]} />
        <meshStandardMaterial
          color={floorMap ? '#ffffff' : template.floor}
          map={floorMap}
          roughness={id === 'starlight' ? 0.35 : 0.85}
          metalness={id === 'starlight' ? 0.25 : 0}
        />
      </mesh>

      {/* Ceiling (the starlight venue is open to the sky) */}
      {id !== 'starlight' && (
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

      {id === 'white-museum' && <MuseumDecor rooms={layout.rooms} template={template} />}
      {id === 'starlight' && <StarlightDecor rooms={layout.rooms} midZ={midZ} />}
      {id === 'japanese' && (
        <JapaneseDecor rooms={layout.rooms} template={template} first={first} last={last} />
      )}
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

function roomCenter(room: RoomSpec) {
  return (room.zStart + room.zEnd) / 2;
}

function MuseumDecor({ rooms, template }: { rooms: RoomSpec[]; template: TemplateStyle }) {
  return (
    <>
      {rooms.map((room) => {
        const cz = roomCenter(room);
        const len = room.zStart - room.zEnd;
        return (
          <group key={room.index}>
            {/* Bench */}
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
            {/* Ceiling light panels */}
            <mesh rotation-x={Math.PI / 2} position={[0, WALL_HEIGHT - 0.01, cz]}>
              <planeGeometry args={[1.4, len - 3]} />
              <meshStandardMaterial color="#ffffff" emissive="#fff6e6" emissiveIntensity={0.9} />
            </mesh>
          </group>
        );
      })}
      <mesh
        position={[0, WALL_HEIGHT - 0.1, (rooms[0]!.zStart + rooms[rooms.length - 1]!.zEnd) / 2]}
      >
        <boxGeometry args={[ROOM_WIDTH, 0.04, 0.04]} />
        <meshStandardMaterial color={template.accent} />
      </mesh>
    </>
  );
}

function StarlightDecor({ rooms, midZ }: { rooms: RoomSpec[]; midZ: number }) {
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
      {/* Glowing trims along the top of the walls */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (ROOM_WIDTH / 2 - 0.03), WALL_HEIGHT - 0.05, midZ]}>
          <boxGeometry args={[0.04, 0.04, rooms[0]!.zStart - rooms[rooms.length - 1]!.zEnd]} />
          <meshStandardMaterial color="#9aa8ff" emissive="#9aa8ff" emissiveIntensity={1.2} />
        </mesh>
      ))}
    </>
  );
}

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

function JapaneseDecor({
  rooms,
  template,
  first,
  last,
}: {
  rooms: RoomSpec[];
  template: TemplateStyle;
  first: RoomSpec;
  last: RoomSpec;
}) {
  const beams: number[] = [];
  for (let z = first.zStart - 1.5; z > last.zEnd; z -= 3) beams.push(z);
  return (
    <>
      <Shoji z={first.zStart} facing={-1} template={template} />
      {/* Ceiling beams */}
      {beams.map((z) => (
        <mesh key={z} position={[0, WALL_HEIGHT - 0.12, z]}>
          <boxGeometry args={[ROOM_WIDTH, 0.18, 0.18]} />
          <meshStandardMaterial color={template.accent} roughness={0.7} />
        </mesh>
      ))}
      {/* Wooden pillars and upper rail (nageshi) */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * (ROOM_WIDTH / 2 - 0.05), 3.2, (first.zStart + last.zEnd) / 2]}>
            <boxGeometry args={[0.08, 0.12, first.zStart - last.zEnd]} />
            <meshStandardMaterial color={template.accent} />
          </mesh>
        </group>
      ))}
      {/* Paper lanterns (andon) in the room corners, out of the walking path */}
      {rooms.map((room) =>
        [
          [-1, room.zStart - 0.7],
          [1, room.zStart - 0.7],
          [-1, room.zEnd + 0.7],
          [1, room.zEnd + 0.7],
        ].map(([side, z]) => (
          <group
            key={`${room.index}:${side}:${z}`}
            position={[side! * (ROOM_WIDTH / 2 - 0.5), 0, z!]}
          >
            <mesh position={[0, 0.45, 0]}>
              <boxGeometry args={[0.35, 0.7, 0.35]} />
              <meshStandardMaterial color="#fff4de" emissive="#ffc77a" emissiveIntensity={1.1} />
            </mesh>
            <mesh position={[0, 0.06, 0]}>
              <boxGeometry args={[0.42, 0.12, 0.42]} />
              <meshStandardMaterial color={template.accent} />
            </mesh>
          </group>
        )),
      )}
    </>
  );
}
