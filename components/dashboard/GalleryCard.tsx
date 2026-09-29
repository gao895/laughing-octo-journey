'use client';

import Link from 'next/link';
import type { GallerySummary } from '@/types/gallery';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { buttonClass } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { getTemplate } from '@/lib/gallery/templates';
import { safeMediaUrl } from '@/lib/gallery/validation';
import { copyText, galleryUrl } from '@/lib/share';
import { t } from '@/lib/i18n';

interface GalleryCardProps {
  gallery: GallerySummary & { visit_count: number };
  onDelete: (gallery: GallerySummary) => void;
}

/** Dashboard card: title, status, artwork count and the main actions. */
export function GalleryCard({ gallery, onDelete }: GalleryCardProps) {
  const toast = useToast();
  const cover = safeMediaUrl(gallery.cover_image_url);
  const published = gallery.status === 'published';

  async function share() {
    const ok = await copyText(galleryUrl(gallery.slug));
    toast(ok ? t.common.copied : t.errors.copy, ok ? 'success' : 'error');
  }

  return (
    <article className="bg-coal flex flex-col overflow-hidden rounded-2xl border border-white/5 shadow-sm">
      <Link
        href={`/dashboard/gallery/${gallery.id}/edit`}
        className="relative block aspect-[16/10] overflow-hidden"
        style={{ background: getTemplate(gallery.template).preview }}
        aria-label={`${gallery.title} ${t.common.edit}`}
      >
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element -- user uploads / data URLs
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="absolute inset-0 m-auto h-[70%] w-auto rounded shadow-2xl ring-4 ring-black/40"
          />
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="line-clamp-2 font-medium">「{gallery.title}」</h2>
          <StatusBadge status={gallery.status} />
        </div>
        <p className="text-mist text-xs">
          {t.dashboard.artworkCount(gallery.artwork_count)}
          {published && ` ・ ${t.dashboard.visitCount(gallery.visit_count)}`}
        </p>
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Link
            href={`/dashboard/gallery/${gallery.id}/edit`}
            className={buttonClass('primary', 'sm')}
          >
            {t.common.edit}
          </Link>
          <Link
            href={`/dashboard/gallery/${gallery.id}/preview`}
            className={buttonClass('secondary', 'sm')}
          >
            {t.common.preview}
          </Link>
          {published && (
            <button type="button" onClick={share} className={buttonClass('secondary', 'sm')}>
              {t.common.share}
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(gallery)}
            className={buttonClass('ghost', 'sm', 'text-mist ml-auto')}
            aria-label={`${gallery.title} ${t.common.delete}`}
          >
            {t.common.delete}
          </button>
        </div>
      </div>
    </article>
  );
}
