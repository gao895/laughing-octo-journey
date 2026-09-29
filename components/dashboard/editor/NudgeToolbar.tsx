'use client';

import type { NudgeAction } from '@/lib/gallery/layout';
import { t } from '@/lib/i18n';

const ACTIONS: { action: NudgeAction; icon: string }[] = [
  { action: 'bigger', icon: '＋' },
  { action: 'smaller', icon: '－' },
  { action: 'left', icon: '←' },
  { action: 'right', icon: '→' },
  { action: 'up', icon: '↑' },
  { action: 'down', icon: '↓' },
];

/** Beginner-friendly adjustments instead of XYZ inputs. */
export function NudgeToolbar({
  title,
  onNudge,
  onDeselect,
}: {
  title: string;
  onNudge: (action: NudgeAction) => void;
  onDeselect: () => void;
}) {
  return (
    <div className="border-line bg-coal/95 pointer-events-auto w-full max-w-xl rounded-2xl border p-3 shadow-2xl backdrop-blur">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <p className="text-mist truncate text-xs">
          {t.editor.selected}：<span className="text-paper">{title || '—'}</span>
        </p>
        <button
          type="button"
          onClick={onDeselect}
          className="text-gold shrink-0 text-xs hover:underline"
        >
          {t.editor.deselect}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {ACTIONS.map(({ action, icon }) => (
          <button
            key={action}
            type="button"
            onClick={() => onNudge(action)}
            className="bg-slate flex min-h-12 flex-col items-center justify-center rounded-xl px-1 text-xs hover:bg-white/10 active:bg-white/15"
          >
            <span aria-hidden className="text-base leading-none">
              {icon}
            </span>
            <span className="mt-1">{t.editor.move[action]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
