'use client';

import { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { ROOM_WIDTH } from '@/lib/gallery/layout';
import { stepsAlong, type DecorProps } from './types';

interface Tree {
  x: number;
  z: number;
  scale: number;
  tint: string;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const GREENS = ['#2f5d34', '#3b6e3a', '#28502e', '#46794a'];

/**
 * 森のギャラリー: a timber pavilion in the woods. Open roof, trees all around
 * (instanced, so hundreds of trees cost two draw calls) and dappled sunlight
 * (komorebi) on the moss.
 */
export function ForestDecor({ zStart, zEnd, length, template }: DecorProps) {
  const trees = useMemo<Tree[]>(() => {
    const r = rng(7);
    const out: Tree[] = [];
    for (const z of stepsAlong(zStart + 8, zEnd - 10, 2.2)) {
      for (const side of [-1, 1]) {
        for (let row = 0; row < 3; row++) {
          out.push({
            x: side * (ROOM_WIDTH / 2 + 1.6 + row * 2.6 + r() * 1.4),
            z: z + (r() - 0.5) * 1.6,
            scale: 0.85 + r() * 0.6,
            tint: GREENS[Math.floor(r() * GREENS.length)]!,
          });
        }
      }
    }
    // Behind the far wall, so the title wall is framed by trees.
    for (let i = 0; i < 12; i++) {
      out.push({
        x: (r() - 0.5) * 22,
        z: zEnd - 2 - r() * 8,
        scale: 0.9 + r() * 0.6,
        tint: GREENS[i % 4]!,
      });
    }
    return out;
  }, [zStart, zEnd]);

  const dapples = useMemo(() => {
    const r = rng(11);
    const count = Math.round(length * 1.2);
    return Array.from({ length: count }, () => ({
      x: (r() - 0.5) * (ROOM_WIDTH - 1.5),
      z: zStart - 0.5 - r() * (length - 1),
      s: 0.25 + r() * 0.6,
    }));
  }, [zStart, length]);

  return (
    <>
      {/* Trunks */}
      <Instances limit={trees.length}>
        <cylinderGeometry args={[0.18, 0.28, 3, 7]} />
        <meshStandardMaterial color="#5a4330" roughness={1} />
        {trees.map((t, i) => (
          <Instance key={i} position={[t.x, 1.5 * t.scale, t.z]} scale={t.scale} />
        ))}
      </Instances>
      {/* Canopies */}
      <Instances limit={trees.length}>
        <coneGeometry args={[1.6, 5.5, 8]} />
        <meshStandardMaterial roughness={0.9} />
        {trees.map((t, i) => (
          <Instance
            key={i}
            position={[t.x, (3 + 2.75) * t.scale, t.z]}
            scale={t.scale}
            color={t.tint}
          />
        ))}
      </Instances>
      {/* Komorebi: soft light spots on the floor */}
      <Instances limit={dapples.length}>
        <circleGeometry args={[1, 20]} />
        <meshBasicMaterial color="#fff3c4" transparent opacity={0.22} depthWrite={false} />
        {dapples.map((d, i) => (
          <Instance key={i} position={[d.x, 0.01, d.z]} rotation-x={-Math.PI / 2} scale={d.s} />
        ))}
      </Instances>
      {/* Pergola: posts just outside the walls carrying beams over the open roof */}
      {stepsAlong(zStart, zEnd - 0.01, 3.4).map((z) => (
        <group key={z} position={[0, 0, z]}>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * (ROOM_WIDTH / 2 + 0.35), 2.3, 0]}>
              <boxGeometry args={[0.3, 4.6, 0.3]} />
              <meshStandardMaterial color={template.accent} roughness={0.9} />
            </mesh>
          ))}
          <mesh position={[0, 4.45, 0]}>
            <boxGeometry args={[ROOM_WIDTH + 1.2, 0.22, 0.2]} />
            <meshStandardMaterial color={template.accent} roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* Wide ground outside the pavilion */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, (zStart + zEnd) / 2]}>
        <planeGeometry args={[80, length + 60]} />
        <meshStandardMaterial color="#56763d" roughness={1} />
      </mesh>
    </>
  );
}
