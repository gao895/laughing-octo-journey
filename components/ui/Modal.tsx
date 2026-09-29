'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { t } from '@/lib/i18n';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  labelledBy?: string;
}

const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' };

/** Accessible modal: closes with Esc / backdrop click, restores focus on close. */
export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`animate-fade-in relative max-h-[92dvh] w-full ${widths[size]} border-line bg-coal overflow-y-auto rounded-t-2xl border p-6 shadow-2xl focus:outline-none sm:rounded-2xl`}
      >
        <button
          type="button"
          onClick={onClose}
          className="text-mist hover:text-paper absolute top-3 right-3 flex size-10 items-center justify-center rounded-full hover:bg-white/5"
          aria-label={t.common.close}
        >
          <span aria-hidden className="text-2xl leading-none">
            ×
          </span>
        </button>
        {title && <h2 className="mb-4 pr-10 text-lg font-semibold">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
