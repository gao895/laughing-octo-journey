'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import type { Artwork } from '@/types/artwork';
import type { Gallery } from '@/types/gallery';
import type { GalleryLayout } from '@/lib/gallery/layout';
import { getTemplate } from '@/lib/gallery/templates';
import { applyAppearance, frameFor, readAppearance } from '@/lib/gallery/appearance';
import { artworkAuthorName } from '@/lib/gallery/author';
import { ArtworkFrame } from './ArtworkFrame';
import { GalleryCamera } from './GalleryCamera';
import { GalleryControls } from './GalleryControls';
import { GalleryLighting } from './GalleryLighting';
import { GalleryRoom } from './GalleryRoom';
import { TitleWall } from './TitleWall';
import type { CameraFocus, MoveInputRef } from './types';

export interface GallerySceneProps {
  gallery: Pick<Gallery, 'template' | 'lighting' | 'title' | 'description' | 'settings'>;
  authorName?: string;
  artworks: Artwork[];
  layout: GalleryLayout;
  selectedId?: string | null;
  onSelectArtwork?: (artwork: Artwork) => void;
  onPointerMissed?: () => void;
  moveInputRef?: MoveInputRef;
  focus?: CameraFocus | null;
  lowRes?: boolean;
  controlsEnabled?: boolean;
  onReady?: () => void;
}

/**
 * The whole 3D venue: camera, lights, room and artworks.
 * Future: avatars (VRM), 3D artworks (GLB) and other visitors (Realtime presence)
 * are meant to be added as additional children of this scene.
 */
export function GalleryScene({
  gallery,
  authorName = '',
  artworks,
  layout,
  selectedId,
  onSelectArtwork,
  onPointerMissed,
  moveInputRef,
  focus,
  lowRes = false,
  controlsEnabled = true,
  onReady,
}: GallerySceneProps) {
  const appearance = readAppearance(gallery.settings);
  const template = applyAppearance(getTemplate(gallery.template), appearance);
  const frame = frameFor(template, appearance);
  const first = layout.rooms[0]!;
  const last = layout.rooms[layout.rooms.length - 1]!;
  const byId = new Map(artworks.map((a) => [a.id, a]));

  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 65, near: 0.05, far: 200, position: [0, 1.6, -1.2] }}
      onPointerMissed={onPointerMissed}
      onCreated={() => onReady?.()}
      className="!absolute inset-0"
    >
      <color attach="background" args={[template.background]} />
      {template.fog && (
        <fog attach="fog" args={[template.fog.color, template.fog.near, template.fog.far]} />
      )}
      <GalleryCamera />
      <GalleryLighting
        template={template}
        preset={gallery.lighting}
        length={first.zStart - last.zEnd}
      />
      <Suspense fallback={null}>
        <GalleryRoom layout={layout} template={template} />
      </Suspense>
      <TitleWall
        title={gallery.title}
        authorName={authorName}
        description={gallery.description}
        template={template}
        z={last.zEnd}
      />
      {layout.placements.map((placement) => {
        const artwork = byId.get(placement.id);
        if (!artwork) return null;
        return (
          <ArtworkFrame
            key={artwork.id}
            artwork={artwork}
            placement={placement}
            frame={frame}
            caption={
              appearance.showCaptions
                ? { title: artwork.title, artist: artworkAuthorName(artwork, authorName) }
                : null
            }
            glow={template.artworkGlow}
            selected={artwork.id === selectedId}
            lowRes={lowRes}
            onSelect={onSelectArtwork}
          />
        );
      })}
      <GalleryControls
        layout={layout}
        moveInputRef={moveInputRef}
        focus={focus}
        enabled={controlsEnabled}
      />
    </Canvas>
  );
}
