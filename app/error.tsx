'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { t } from '@/lib/i18n';

/** Friendly fallback for unexpected errors; technical details go to the console in development. */
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') console.error(error);
  }, [error]);
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-lg">{t.errors.generic}</p>
      <Button variant="secondary" onClick={reset}>
        {t.common.back}
      </Button>
    </main>
  );
}
