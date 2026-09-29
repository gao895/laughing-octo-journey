'use client';

import type { TemplateId } from '@/types/gallery';
import { TEMPLATE_ORDER, TEMPLATES } from '@/lib/gallery/templates';
import { t } from '@/lib/i18n';

/** 会場を選ぶ: card grid. Templates not implemented yet are shown as 「準備中」. */
export function TemplatePicker({
  value,
  onChange,
  columns = 'sm:grid-cols-2 lg:grid-cols-4',
}: {
  value: TemplateId;
  onChange: (id: TemplateId) => void;
  columns?: string;
}) {
  return (
    <div role="radiogroup" className={`grid grid-cols-2 gap-3 ${columns}`}>
      {TEMPLATE_ORDER.map((id) => {
        const tpl = TEMPLATES[id];
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={!tpl.available}
            onClick={() => onChange(id)}
            className={`group overflow-hidden rounded-xl border text-left transition ${
              selected ? 'border-gold ring-gold/40 ring-2' : 'border-line hover:border-white/30'
            } disabled:cursor-not-allowed disabled:opacity-45`}
          >
            <div className="relative aspect-[4/3]" style={{ background: tpl.preview }}>
              {selected && (
                <span className="bg-gold text-ink absolute top-2 right-2 flex size-6 items-center justify-center rounded-full text-xs">
                  ✓
                </span>
              )}
              {!tpl.available && (
                <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
                  {t.wizard.comingSoon}
                </span>
              )}
            </div>
            <div className="bg-coal p-3">
              <p className="text-sm font-medium">{t.templates[id].name}</p>
              <p className="text-mist mt-1 line-clamp-2 text-xs">{t.templates[id].body}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
