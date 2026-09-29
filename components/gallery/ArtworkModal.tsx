'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Artwork } from '@/types/artwork';
import { safeMediaUrl } from '@/lib/gallery/validation';
import { t } from '@/lib/i18n';

interface ArtworkModalProps {
  artwork: Artwork | null;
  authorName: string;
  onClose: () => void;
}

/** Artwork details: image, title, author and description. */
export function ArtworkModal({ artwork, authorName, onClose }: ArtworkModalProps) {
  const src = safeMediaUrl(artwork?.image_url);
  return (
    <Modal open={Boolean(artwork)} onClose={onClose} title={artwork?.title || undefined} size="lg">
      {artwork && (
        <div className="flex flex-col gap-5">
          {src && (
            <div className="flex justify-center overflow-hidden rounded-xl bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element -- user uploads / data URLs */}
              <img
                src={src}
                alt={artwork.title}
                className="max-h-[60dvh] w-auto object-contain"
                width={artwork.width}
                height={artwork.height}
              />
            </div>
          )}
          <div className="space-y-3">
            {authorName && (
              <p className="text-mist text-sm">
                {t.viewer.author}：<span className="text-paper">{authorName}</span>
              </p>
            )}
            {artwork.description && (
              <p className="text-paper/90 text-sm leading-relaxed whitespace-pre-wrap">
                {artwork.description}
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              {t.common.close}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
