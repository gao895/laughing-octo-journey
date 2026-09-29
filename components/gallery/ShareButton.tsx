'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { copyText, galleryUrl } from '@/lib/share';
import { t } from '@/lib/i18n';

/** 「この個展を共有」: shows the URL with a copy button. (X / LINE can be added via shareLinks.) */
export function ShareButton({
  slug,
  title,
  label = t.viewer.share,
  className = '',
}: {
  slug: string;
  title: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const url = galleryUrl(slug);

  async function copy() {
    const ok = await copyText(url);
    toast(ok ? t.common.copied : t.errors.copy, ok ? 'success' : 'error');
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`pointer-events-auto flex min-h-11 items-center gap-2 rounded-full bg-black/55 px-4 text-sm text-white backdrop-blur hover:bg-black/70 ${className}`}
      >
        <span aria-hidden>↗</span>
        {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t.viewer.share} size="sm">
        <p className="text-mist mb-2 text-sm">{title}</p>
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="border-line bg-ink text-paper mb-4 w-full rounded-xl border px-3 py-3 text-sm"
          aria-label={t.editor.shareUrl}
        />
        <Button className="w-full" onClick={copy}>
          {t.common.copyUrl}
        </Button>
      </Modal>
    </>
  );
}
