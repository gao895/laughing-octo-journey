'use client';

import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { SRGBColorSpace, type MeshStandardMaterial } from 'three';
import type { Artwork } from '@/types/artwork';
import { artworkSize, type ArtworkPlacement } from '@/lib/gallery/layout';
import { safeMediaUrl } from '@/lib/gallery/validation';
import type { FrameSpec } from '@/lib/gallery/appearance';
import { CaptionPlate, PLATE_H, PLATE_W } from './CaptionPlate';

interface ArtworkFrameProps {
  artwork: Artwork;
  placement: ArtworkPlacement;
  frame: FrameSpec;
  /** Caption plate text; null hides the plate. */
  caption?: { title: string; artist: string } | null;
  glow: number;
  selected?: boolean;
  /** Use the thumbnail texture (phones / many artworks) to save GPU memory. */
  lowRes?: boolean;
  onSelect?: (artwork: Artwork) => void;
}

/** Pointer movement (px) above which a press counts as a drag (looking around), not a click. */
const CLICK_TOLERANCE = 6;

/** One artwork hung on a wall: frame + image. Hover brightens it; click opens details. */
export function ArtworkFrame({
  artwork,
  placement,
  frame,
  caption = null,
  glow,
  selected = false,
  lowRes = false,
  onSelect,
}: ArtworkFrameProps) {
  const [hovered, setHovered] = useState(false);
  const { w, h } = artworkSize(artwork.width, artwork.height, placement.scale);
  const url = safeMediaUrl(lowRes ? artwork.thumbnail_url : artwork.image_url);

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = 'pointer';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hovered]);

  const placeholder = <ImagePlaceholder w={w} h={h} />;

  return (
    <group
      position={[placement.x, placement.y, placement.z]}
      rotation-y={placement.rotationY}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (e.delta <= CLICK_TOLERANCE) onSelect?.(artwork);
      }}
    >
      {selected && (
        // A thin plate just in front of the wall (the wall surface is at z = -0.03),
        // so it never z-fights with the wall.
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[w + frame.border * 2 + 0.12, h + frame.border * 2 + 0.12]} />
          <meshBasicMaterial color="#d9c38a" />
        </mesh>
      )}
      {frame.border > 0 && (
        <mesh position={[0, 0, -0.022]}>
          <boxGeometry args={[w + frame.border * 2, h + frame.border * 2, 0.04]} />
          <meshStandardMaterial
            color={frame.color}
            emissive={frame.color}
            emissiveIntensity={frame.glow ?? 0}
            roughness={frame.roughness}
            metalness={frame.metalness}
          />
        </mesh>
      )}
      {caption && (
        <CaptionPlate
          title={caption.title}
          artist={caption.artist}
          x={w / 2 + frame.border + 0.12 + PLATE_W / 2}
          y={-h / 2 + PLATE_H / 2}
        />
      )}
      {url ? (
        <TextureErrorBoundary fallback={placeholder}>
          <Suspense fallback={placeholder}>
            <ArtworkImage url={url} w={w} h={h} glow={glow} highlighted={hovered || selected} />
          </Suspense>
        </TextureErrorBoundary>
      ) : (
        placeholder
      )}
    </group>
  );
}

function ArtworkImage({
  url,
  w,
  h,
  glow,
  highlighted,
}: {
  url: string;
  w: number;
  h: number;
  glow: number;
  highlighted: boolean;
}) {
  const texture = useTexture(url, (tex) => {
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 4;
  });
  const material = useRef<MeshStandardMaterial>(null);

  // Smoothly brighten the artwork while hovered.
  useFrame((_, dt) => {
    const m = material.current;
    if (!m) return;
    const target = glow + (highlighted ? 0.35 : 0);
    m.emissiveIntensity += (target - m.emissiveIntensity) * Math.min(1, dt * 10);
  });

  return (
    <mesh position={[0, 0, 0.002]}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial
        ref={material}
        map={texture}
        emissiveMap={texture}
        emissive="#ffffff"
        emissiveIntensity={glow}
        roughness={0.9}
        toneMapped={false}
      />
    </mesh>
  );
}

function ImagePlaceholder({ w, h }: { w: number; h: number }) {
  return (
    <mesh position={[0, 0, 0.002]}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial color="#55555c" />
    </mesh>
  );
}

class TextureErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== 'production')
      console.error('[ArtworkFrame] texture failed', error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
