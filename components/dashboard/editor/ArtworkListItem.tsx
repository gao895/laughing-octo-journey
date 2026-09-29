'use client';

import type { Artwork } from '@/types/artwork';
import { TextArea, TextField } from '@/components/ui/Field';
import { DESCRIPTION_MAX, TITLE_MAX, safeMediaUrl } from '@/lib/gallery/validation';
import { t } from '@/lib/i18n';
import { AiTitleButton } from '../AiTitleButton';

interface Props {
  artwork: Artwork;
  index: number;
  total: number;
  selected: boolean;
  onChange: (patch: { title?: string; description?: string }) => void;
  onSelect: () => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
}

export function ArtworkListItem({
  artwork,
  index,
  total,
  selected,
  onChange,
  onSelect,
  onMove,
  onDelete,
}: Props) {
  const thumb = safeMediaUrl(artwork.thumbnail_url);
  return (
    <li
      className={`rounded-2xl border p-3 transition ${selected ? 'border-gold bg-gold/5' : 'border-line bg-coal'}`}
    >
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onSelect}
          className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-black/40"
          aria-label={t.editor.selectArtwork(artwork.title || `#${index + 1}`)}
        >
          {thumb && (
            // eslint-disable-next-line @next/next/no-img-element -- user uploads / data URLs
            <img src={thumb} alt="" className="size-full object-cover" loading="lazy" />
          )}
          <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 text-[10px]">
            #{index + 1}
          </span>
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <TextField
            label={t.uploader.title}
            value={artwork.title}
            maxLength={TITLE_MAX}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </div>
      </div>
      <details className="group mt-3">
        <summary className="text-mist hover:text-paper cursor-pointer text-xs select-none">
          {t.uploader.description}
        </summary>
        <div className="mt-3 flex flex-col gap-2">
          <TextArea
            label={t.uploader.description}
            placeholder={t.uploader.descriptionPlaceholder}
            value={artwork.description}
            maxLength={DESCRIPTION_MAX}
            onChange={(e) => onChange({ description: e.target.value })}
          />
          <AiTitleButton
            imageUrl={artwork.thumbnail_url}
            onTitle={(title) => onChange({ title })}
          />
        </div>
      </details>
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        <SmallButton onClick={onSelect}>
          {selected ? '✓ ' : ''}
          {t.editor.adjust}
        </SmallButton>
        <SmallButton onClick={() => onMove(-1)} disabled={index === 0}>
          ↑ {t.editor.moveUp}
        </SmallButton>
        <SmallButton onClick={() => onMove(1)} disabled={index === total - 1}>
          ↓ {t.editor.moveDown}
        </SmallButton>
        <SmallButton onClick={onDelete} className="ml-auto text-red-300">
          {t.common.delete}
        </SmallButton>
      </div>
    </li>
  );
}

function SmallButton({ className = '', ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`bg-slate min-h-9 rounded-lg px-3 hover:bg-white/10 disabled:opacity-40 ${className}`}
      {...rest}
    />
  );
}
