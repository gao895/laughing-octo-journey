'use client';

import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { t } from '@/lib/i18n';

/** 「ギャラリーを準備しています…」 then 「作品を読み込んでいます…」 with a progress bar. */
export function LoadingOverlay({ sceneReady }: { sceneReady: boolean }) {
  const { active, progress } = useProgress();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!sceneReady || active) return;
    const timer = setTimeout(() => setHidden(true), 500);
    return () => clearTimeout(timer);
  }, [sceneReady, active]);

  if (hidden && !active) return null;

  const pct = sceneReady ? Math.round(progress) : 0;
  return (
    <div
      className="bg-ink/90 pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 transition-opacity"
      role="status"
      aria-live="polite"
    >
      <span className="border-gold size-8 animate-spin rounded-full border-2 border-t-transparent" />
      <p className="text-paper text-sm">
        {sceneReady ? t.viewer.loadingArtworks : t.viewer.preparing}
      </p>
      <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
        <div
          className="bg-gold h-full transition-[width] duration-300"
          style={{ width: `${Math.max(pct, 5)}%` }}
        />
      </div>
    </div>
  );
}
