'use client';

import { useRef, useState, type DragEvent } from 'react';
import type { PreparedImage } from '@/types/artwork';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ARTWORK_ACCEPT, isVideoFile, validateArtworkFile } from '@/lib/gallery/validation';
import { prepareImage, prepareVideo } from '@/lib/image/optimize';
import { logDev, toFriendlyMessage } from '@/lib/errors';
import { t } from '@/lib/i18n';

export interface PreparedFile {
  image: PreparedImage;
  fileName: string;
}

interface ArtworkUploaderProps {
  /** Called with optimised images that passed validation. */
  onPrepared: (files: PreparedFile[]) => void | Promise<void>;
  compact?: boolean;
  disabled?: boolean;
}

/**
 * Drag & drop / file picker. Validates type and size, then resizes each image in
 * the browser before anything is uploaded.
 */
export function ArtworkUploader({
  onPrepared,
  compact = false,
  disabled = false,
}: ArtworkUploaderProps) {
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const busy = disabled || progress !== null;

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0 || busy) return;
    const files = Array.from(list);
    const accepted: File[] = [];
    const errors = new Set<string>();
    for (const file of files) {
      const result = validateArtworkFile(file);
      if (result.ok) accepted.push(file);
      else errors.add(result.message);
    }
    errors.forEach((message) => toast(message, 'error'));
    if (accepted.length === 0) return;

    setProgress({ done: 0, total: accepted.length });
    const prepared: PreparedFile[] = [];
    for (const file of accepted) {
      try {
        const image = isVideoFile(file)
          ? await prepareVideo(file, file.name)
          : await prepareImage(file, file.name);
        prepared.push({ image, fileName: file.name });
      } catch (e) {
        logDev('prepareImage', e);
        toast(`${file.name}: ${toFriendlyMessage(e, t.errors.imageBroken)}`, 'error');
      }
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
    }
    try {
      if (prepared.length) await onPrepared(prepared);
    } finally {
      setProgress(null);
      if (input.current) input.current.value = '';
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    void handleFiles(e.dataTransfer.files);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!busy) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed text-center transition-colors ${
        compact ? 'px-4 py-6' : 'px-6 py-12'
      } ${dragging ? 'border-gold bg-gold/5' : 'border-line bg-coal/60'}`}
    >
      <input
        ref={input}
        type="file"
        accept={ARTWORK_ACCEPT}
        multiple
        className="sr-only"
        onChange={(e) => void handleFiles(e.target.files)}
        data-testid="artwork-file-input"
        tabIndex={-1}
      />
      {progress ? (
        <div className="flex flex-col items-center gap-3" role="status">
          <span className="border-gold size-7 animate-spin rounded-full border-2 border-t-transparent" />
          <p className="text-sm">{t.uploader.processing(progress.done, progress.total)}</p>
        </div>
      ) : (
        <>
          {!compact && (
            <span className="text-4xl" aria-hidden>
              🖼️
            </span>
          )}
          <p className="text-paper/90 hidden text-sm sm:block">{t.uploader.drop}</p>
          <p className="text-mist hidden text-xs sm:block">{t.uploader.or}</p>
          <Button
            onClick={() => input.current?.click()}
            disabled={busy}
            size={compact ? 'sm' : 'md'}
          >
            {compact ? t.uploader.addArtwork : t.uploader.choose}
          </Button>
          <p className="text-mist text-xs">{t.uploader.formats}</p>
        </>
      )}
    </div>
  );
}
