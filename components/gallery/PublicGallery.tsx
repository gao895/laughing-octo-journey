'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { GalleryWithArtworks } from '@/types/gallery';
import { ButtonLink } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { getRepository } from '@/lib/data';
import { logDev, toFriendlyMessage } from '@/lib/errors';
import { getVisitorId } from '@/lib/visitor';
import { t } from '@/lib/i18n';

const GalleryViewer = dynamic(() => import('./GalleryViewer').then((m) => m.GalleryViewer), {
  ssr: false,
  loading: () => <FullScreenMessage>{<Spinner label={t.viewer.preparing} />}</FullScreenMessage>,
});

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; data: GalleryWithArtworks }
  | { kind: 'missing' }
  | { kind: 'error'; message: string };

function FullScreenMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      {children}
    </div>
  );
}

export function PublicGallery({ slug }: { slug: string }) {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const repo = getRepository();
    repo
      .getPublishedGallery(slug)
      .then((data) => {
        if (cancelled) return;
        setState(data ? { kind: 'ready', data } : { kind: 'missing' });
        if (data) void repo.recordVisit(data.gallery.id, getVisitorId()).catch(() => undefined);
      })
      .catch((e) => {
        logDev('PublicGallery', e);
        if (!cancelled) setState({ kind: 'error', message: toFriendlyMessage(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state.kind === 'loading') {
    return (
      <FullScreenMessage>
        <Spinner label={t.viewer.preparing} />
      </FullScreenMessage>
    );
  }
  if (state.kind !== 'ready') {
    return (
      <FullScreenMessage>
        <p className="text-lg">{state.kind === 'missing' ? t.viewer.notFound : state.message}</p>
        {state.kind === 'missing' && <p className="text-mist text-sm">{t.viewer.notFoundBody}</p>}
        <ButtonLink href="/" variant="secondary">
          {t.common.back}
        </ButtonLink>
      </FullScreenMessage>
    );
  }
  return (
    <GalleryViewer
      data={state.data}
      topRight={
        <ButtonLink
          href="/explore"
          variant="ghost"
          size="sm"
          className="pointer-events-auto hidden rounded-full bg-black/40 text-white sm:inline-flex"
        >
          {t.common.back}
        </ButtonLink>
      }
    />
  );
}
