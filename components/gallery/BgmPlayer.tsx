'use client';

import { useEffect, useRef, useState } from 'react';
import { safeMediaUrl } from '@/lib/gallery/validation';
import { t } from '@/lib/i18n';

/**
 * BGM never auto-plays (browsers block it anyway): it starts only when the
 * visitor presses 「BGMを再生」.
 */
export function BgmPlayer({ url }: { url: string | null }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const src = safeMediaUrl(url);

  useEffect(() => {
    return () => {
      audio.current?.pause();
      audio.current = null;
    };
  }, [src]);

  if (!src) return null;

  async function toggle() {
    if (!audio.current) {
      audio.current = new Audio(src!);
      audio.current.loop = true;
      audio.current.volume = 0.6;
    }
    if (playing) {
      audio.current.pause();
      setPlaying(false);
    } else {
      try {
        await audio.current.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={playing}
      className="pointer-events-auto flex min-h-11 items-center gap-2 rounded-full bg-black/55 px-4 text-sm text-white backdrop-blur hover:bg-black/70"
    >
      <span aria-hidden>{playing ? '■' : '♪'}</span>
      {playing ? t.viewer.bgmStop : t.viewer.bgmPlay}
    </button>
  );
}
