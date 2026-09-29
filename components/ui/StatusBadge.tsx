import type { GalleryStatus } from '@/types/gallery';
import { t } from '@/lib/i18n';

const styles: Record<GalleryStatus, string> = {
  published: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
  draft: 'bg-white/5 text-mist ring-line',
  private: 'bg-amber-500/10 text-amber-200 ring-amber-400/30',
};

export function StatusBadge({ status }: { status: GalleryStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${styles[status]}`}
    >
      {status === 'published' && <span className="mr-1.5 size-1.5 rounded-full bg-emerald-400" />}
      {t.status[status]}
    </span>
  );
}
