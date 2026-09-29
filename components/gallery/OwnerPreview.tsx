'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { GalleryWithArtworks } from '@/types/gallery';
import { ButtonLink } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { getRepository } from '@/lib/data';
import { logDev } from '@/lib/errors';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { t } from '@/lib/i18n';

const GalleryViewer = dynamic(() => import('./GalleryViewer').then((m) => m.GalleryViewer), {
  ssr: false,
  loading: () => <Spinner label={t.viewer.preparing} />,
});

/** Owner preview: exactly what visitors see, with editing UI hidden. Works for drafts too. */
export function OwnerPreview({ galleryId }: { galleryId: string }) {
  const { user } = useCurrentUser({ required: true });
  const [data, setData] = useState<GalleryWithArtworks | null | 'missing'>(null);

  useEffect(() => {
    if (!user) return;
    getRepository()
      .getGalleryForOwner(galleryId)
      .then((d) => setData(d ?? 'missing'))
      .catch((e) => {
        logDev('preview', e);
        setData('missing');
      });
  }, [user, galleryId]);

  if (!data) return <Spinner label={t.viewer.preparing} />;
  if (data === 'missing') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p>{t.errors.forbidden}</p>
        <ButtonLink href="/dashboard" variant="secondary">
          {t.common.back}
        </ButtonLink>
      </div>
    );
  }

  return (
    <GalleryViewer
      data={data}
      banner={t.viewer.previewBanner}
      showShare={data.gallery.status === 'published'}
      topRight={
        <ButtonLink
          href={`/dashboard/gallery/${galleryId}/edit`}
          size="sm"
          className="pointer-events-auto rounded-full"
        >
          {t.viewer.exitPreview}
        </ButtonLink>
      }
    />
  );
}
