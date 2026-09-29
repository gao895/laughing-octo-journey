'use client';

import { useMemo, useRef, useState } from 'react';
import type { Artwork } from '@/types/artwork';
import type { GalleryWithArtworks } from '@/types/gallery';
import { resolvePlacements, viewpointFor } from '@/lib/gallery/layout';
import { useClientValue } from '@/lib/hooks/useClientValue';
import { isTouchDevice, isWebGLAvailable } from '@/lib/webgl';
import { t } from '@/lib/i18n';
import { ArtworkModal } from './ArtworkModal';
import { BgmPlayer } from './BgmPlayer';
import { GalleryScene } from './GalleryScene';
import { LoadingOverlay } from './LoadingOverlay';
import { ShareButton } from './ShareButton';
import { VirtualJoystick } from './VirtualJoystick';
import type { CameraFocus, MoveInput } from './types';

interface GalleryViewerProps {
  data: GalleryWithArtworks;
  /** Extra controls in the top bar (e.g. 「プレビューを終わる」). */
  topRight?: React.ReactNode;
  banner?: string;
  showShare?: boolean;
}

/** Full-screen visitor experience used by the public page and the owner preview. */
export function GalleryViewer({ data, topRight, banner, showShare = true }: GalleryViewerProps) {
  const { gallery, artworks, authorName } = data;
  const [selected, setSelected] = useState<Artwork | null>(null);
  const [ready, setReady] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const moveInputRef = useRef<MoveInput>({ x: 0, y: 0 });
  const [tour, setTour] = useState<{ index: number; focus: CameraFocus } | null>(null);
  const touch = useClientValue(isTouchDevice, false);
  const webgl = useClientValue(isWebGLAvailable, true);

  const layout = useMemo(
    () => resolvePlacements(artworks, gallery.layout_mode),
    [artworks, gallery.layout_mode],
  );
  // Phones and big exhibitions use thumbnails as textures to keep memory low.
  const lowRes = touch || artworks.length > 16;

  /** 「次の作品」/「前の作品」: glide to stand in front of the next artwork. */
  function goTo(step: 1 | -1) {
    const count = layout.placements.length;
    if (count === 0) return;
    const current = tour?.index ?? (step === 1 ? -1 : 0);
    const index = (current + step + count) % count;
    const placement = layout.placements[index]!;
    setTour({ index, focus: { ...viewpointFor(placement, layout), key: Date.now() } });
    setHintVisible(false);
  }

  return (
    <div className="bg-ink fixed inset-0 overflow-hidden select-none">
      {webgl ? (
        <GalleryScene
          gallery={gallery}
          authorName={authorName}
          artworks={artworks}
          layout={layout}
          onSelectArtwork={(a) => {
            setSelected(a);
            setHintVisible(false);
          }}
          moveInputRef={moveInputRef}
          focus={tour?.focus ?? null}
          lowRes={lowRes}
          controlsEnabled={!selected}
          onReady={() => setReady(true)}
        />
      ) : (
        <div className="text-mist flex h-full items-center justify-center p-8 text-center">
          {t.viewer.noWebgl}
        </div>
      )}

      {webgl && <LoadingOverlay sceneReady={ready} />}

      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="min-w-0 text-white drop-shadow">
          <h1 className="truncate text-base font-semibold sm:text-lg">{gallery.title}</h1>
          {authorName && (
            <p className="text-xs text-white/75">
              {t.viewer.author}：{authorName}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {topRight}
          {showShare && <ShareButton slug={gallery.slug} title={gallery.title} />}
        </div>
      </div>

      {banner && (
        <div className="bg-gold/90 text-ink pointer-events-none absolute top-20 left-1/2 z-10 -translate-x-1/2 rounded-full px-4 py-1.5 text-xs font-medium shadow">
          {banner}
        </div>
      )}

      {artworks.length === 0 && ready && (
        <div className="pointer-events-none absolute inset-x-0 top-1/3 z-10 text-center text-white/90 drop-shadow">
          {t.viewer.emptyGallery}
        </div>
      )}

      {/* Controls hint */}
      {hintVisible && ready && (
        <button
          type="button"
          onClick={() => setHintVisible(false)}
          className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-10 hidden -translate-x-1/2 rounded-full bg-black/55 px-4 py-2 text-xs text-white backdrop-blur sm:block"
        >
          {t.viewer.controlsPc}
        </button>
      )}
      {touch && hintVisible && ready && (
        <p className="pointer-events-none absolute inset-x-6 top-24 z-10 text-center text-xs text-white/85 drop-shadow sm:hidden">
          {t.viewer.controlsMobile}
        </p>
      )}

      {/* Phone controls */}
      {touch && webgl && (
        <div className="pointer-events-none absolute inset-0 z-10">
          <VirtualJoystick inputRef={moveInputRef} />
        </div>
      )}

      {/* Artwork tour + BGM (bottom-right) */}
      <div className="pointer-events-none absolute right-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-10 flex flex-col items-end gap-2">
        {artworks.length > 0 && ready && (
          <div className="pointer-events-auto flex overflow-hidden rounded-full bg-black/55 text-sm text-white backdrop-blur">
            <button
              type="button"
              onClick={() => goTo(-1)}
              className="min-h-11 px-4 hover:bg-white/10"
            >
              ‹ <span className="hidden sm:inline">{t.viewer.prevArtwork}</span>
            </button>
            <span className="self-center px-1 text-xs text-white/70" aria-live="polite">
              {tour ? `${tour.index + 1} / ${artworks.length}` : `${artworks.length}`}
            </span>
            <button
              type="button"
              onClick={() => goTo(1)}
              className="min-h-11 px-4 hover:bg-white/10"
            >
              {t.viewer.nextArtwork} ›
            </button>
          </div>
        )}
        <BgmPlayer url={gallery.bgm_url} />
      </div>

      <ArtworkModal artwork={selected} authorName={authorName} onClose={() => setSelected(null)} />
    </div>
  );
}
