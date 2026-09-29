'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { PublishedGalleryCard } from '@/lib/data/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { getRepository } from '@/lib/data';
import { logDev, toFriendlyMessage } from '@/lib/errors';
import { getTemplate } from '@/lib/gallery/templates';
import { safeMediaUrl } from '@/lib/gallery/validation';
import { t } from '@/lib/i18n';

export function ExploreList() {
  const [items, setItems] = useState<PublishedGalleryCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRepository()
      .listPublishedGalleries()
      .then(setItems)
      .catch((e) => {
        logDev('ExploreList', e);
        setError(toFriendlyMessage(e));
      });
  }, []);

  if (error) return <p className="text-red-200">{error}</p>;
  if (!items) return <Spinner label={t.common.loading} />;
  if (items.length === 0) return <EmptyState title={t.explore.empty} />;

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ gallery, authorName, artworkCount }) => {
        const cover = safeMediaUrl(gallery.cover_image_url);
        return (
          <li key={gallery.id}>
            <Link
              href={`/gallery/${gallery.slug}`}
              className="group bg-coal hover:border-gold/40 block overflow-hidden rounded-2xl border border-white/5 transition"
            >
              <div
                className="relative aspect-[16/10] overflow-hidden"
                style={{ background: getTemplate(gallery.template).preview }}
              >
                {cover && (
                  // eslint-disable-next-line @next/next/no-img-element -- user uploads / data URLs
                  <img
                    src={cover}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 m-auto h-[70%] w-auto rounded shadow-2xl ring-4 ring-black/40 transition group-hover:scale-[1.03]"
                  />
                )}
              </div>
              <div className="p-4">
                <p className="truncate font-medium">{gallery.title}</p>
                <p className="text-mist mt-1 text-xs">
                  {authorName && `${t.explore.by(authorName)} ・ `}
                  {t.dashboard.artworkCount(artworkCount)}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
