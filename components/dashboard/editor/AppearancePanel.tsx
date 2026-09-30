'use client';

import type { GallerySettings } from '@/types/gallery';
import {
  FRAME_STYLE_ORDER,
  FRAME_STYLES,
  WALL_SWATCHES,
  type Appearance,
} from '@/lib/gallery/appearance';
import { BACKDROP_IDS, backdropThumbUrl } from '@/lib/gallery/backdrops';
import { t } from '@/lib/i18n';

interface Props {
  appearance: Appearance;
  /** Wall and frame colours of the current venue (for the 「会場のまま」 previews). */
  venueWall: string;
  venueFrame: string;
  onChange: (patch: Partial<GallerySettings>) => void;
}

const chip =
  'flex min-h-10 items-center gap-2 rounded-xl border px-3 text-sm transition focus-visible:outline-2';
const on = 'border-gold bg-gold/10 text-paper';
const off = 'border-line bg-coal text-paper/80 hover:border-white/30';

/** 壁の色・額縁・作品の名札: simple choices, previewed live in the 3D view. */
export function AppearancePanel({ appearance, venueWall, venueFrame, onChange }: Props) {
  const wall = appearance.wallColor;
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3" aria-labelledby="backdrop-label">
        <h3 id="backdrop-label" className="text-sm font-medium">
          {t.editor.backdrop}
        </h3>
        <p className="text-mist text-xs leading-relaxed">{t.editor.backdropHelp}</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={appearance.backdrop === null}
            onClick={() => onChange({ backdrop: undefined })}
            className={`overflow-hidden rounded-xl border text-left transition ${
              appearance.backdrop === null
                ? 'border-gold ring-gold/30 ring-2'
                : 'border-line hover:border-white/30'
            }`}
          >
            <span className="bg-slate text-mist flex aspect-[2/1] items-center justify-center text-xs">
              🏛️
            </span>
            <span className="bg-coal block px-2 py-1.5 text-xs">{t.editor.backdropNone}</span>
          </button>
          {BACKDROP_IDS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={appearance.backdrop === id}
              onClick={() => onChange({ backdrop: id })}
              className={`overflow-hidden rounded-xl border text-left transition ${
                appearance.backdrop === id
                  ? 'border-gold ring-gold/30 ring-2'
                  : 'border-line hover:border-white/30'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static thumbnail */}
              <img
                src={backdropThumbUrl(id)}
                alt=""
                loading="lazy"
                className="block aspect-[2/1] w-full object-cover"
              />
              <span className="bg-coal block px-2 py-1.5 text-xs">{t.editor.backdrops[id]}</span>
            </button>
          ))}
        </div>
        <p className="text-mist/70 text-[10px]">{t.editor.backdropCredit}</p>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="wall-color-label">
        <h3 id="wall-color-label" className="text-sm font-medium">
          {t.editor.wallColor}
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={wall === null}
            onClick={() => onChange({ wallColor: undefined })}
            className={`${chip} ${wall === null ? on : off}`}
          >
            <span
              className="size-5 rounded-full ring-1 ring-white/20"
              style={{ background: venueWall }}
            />
            {t.editor.wallColorVenue}
          </button>
          {WALL_SWATCHES.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={wall === s.color}
              aria-label={t.editor.wallSwatches[s.id]}
              title={t.editor.wallSwatches[s.id]}
              onClick={() => onChange({ wallColor: s.color })}
              className={`ring-offset-ink size-10 rounded-full ring-offset-2 transition ${
                wall === s.color ? 'ring-gold ring-2' : 'ring-1 ring-white/20 hover:ring-white/50'
              }`}
              style={{ background: s.color }}
            />
          ))}
          <label className={`${chip} ${off} cursor-pointer`}>
            <input
              id="wall-color-custom"
              type="color"
              value={wall ?? venueWall}
              onChange={(e) => onChange({ wallColor: e.target.value })}
              className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            {t.editor.wallColorCustom}
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="frame-label">
        <h3 id="frame-label" className="text-sm font-medium">
          {t.editor.frame}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {FRAME_STYLE_ORDER.map((style) => {
            const spec = style === 'venue' ? null : FRAME_STYLES[style];
            const color = spec ? spec.color : venueFrame;
            const border = spec ? spec.border : 0.07;
            return (
              <button
                key={style}
                type="button"
                aria-pressed={appearance.frameStyle === style}
                onClick={() => onChange({ frameStyle: style })}
                className={`${chip} flex-col justify-center py-2 ${appearance.frameStyle === style ? on : off}`}
              >
                <span
                  aria-hidden
                  className="block h-7 w-9 rounded-[2px] bg-gradient-to-br from-sky-200 to-rose-200"
                  style={{
                    boxShadow: border > 0 ? `0 0 0 ${Math.round(border * 60)}px ${color}` : 'none',
                  }}
                />
                <span className="mt-1 text-xs">{t.editor.frameStyles[style]}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="captions-label">
        <h3 id="captions-label" className="text-sm font-medium">
          {t.editor.captions}
        </h3>
        <p className="text-mist text-xs">{t.editor.captionsHelp}</p>
        <div className="flex gap-2">
          {[true, false].map((value) => (
            <button
              key={String(value)}
              type="button"
              aria-pressed={appearance.showCaptions === value}
              onClick={() => onChange({ showCaptions: value })}
              className={`${chip} ${appearance.showCaptions === value ? on : off}`}
            >
              {value ? t.editor.captionsOn : t.editor.captionsOff}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
