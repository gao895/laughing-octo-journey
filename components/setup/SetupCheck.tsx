'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { copyText } from '@/lib/share';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { runSetupChecks, type CheckResult, type SetupClient } from '@/lib/setup/checks';
import { useClientValue } from '@/lib/hooks/useClientValue';
import { t } from '@/lib/i18n';

const ICON: Record<CheckResult['status'], string> = { ok: '✓', fail: '✕', skip: '–' };
const TONE: Record<CheckResult['status'], string> = {
  ok: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
  fail: 'bg-red-500/15 text-red-200 ring-red-400/40',
  skip: 'bg-white/5 text-mist ring-line',
};

async function check(configured: boolean): Promise<CheckResult[]> {
  let client: SetupClient | null = null;
  if (configured) {
    const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
    client = getSupabaseBrowserClient() as unknown as SetupClient;
  }
  return runSetupChecks(client, configured);
}

/** /setup: plain-language checklist of the production Supabase configuration. */
export function SetupCheck() {
  const toast = useToast();
  const configured = isSupabaseConfigured();
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const origin = useClientValue(() => window.location.origin, '');
  const redirectUrl = origin ? `${origin}/auth/callback` : '';

  const run = useCallback(async () => {
    setResults(null);
    setResults(await check(configured));
  }, [configured]);

  useEffect(() => {
    let cancelled = false;
    void check(configured).then((r) => {
      if (!cancelled) setResults(r);
    });
    return () => {
      cancelled = true;
    };
  }, [configured]);

  const allOk = results?.every((r) => r.status === 'ok');

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold">{t.setup.title}</h1>
      <p className="text-mist mt-2 text-sm leading-relaxed">{t.setup.lead}</p>
      {!configured && (
        <p className="border-gold/25 bg-gold/5 text-gold/90 mt-4 rounded-xl border px-4 py-3 text-sm">
          {t.setup.demo}
        </p>
      )}

      <ol className="mt-6 flex flex-col gap-3" aria-live="polite" aria-busy={!results}>
        {(results ?? []).map((r) => {
          const c = t.setup.checks[r.id];
          return (
            <li
              key={r.id}
              className="bg-coal rounded-2xl border border-white/5 p-4"
              data-status={r.status}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{c.name}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${TONE[r.status]}`}
                >
                  {ICON[r.status]} {t.setup.status[r.status]}
                </span>
              </div>
              {r.status === 'fail' && (
                <p className="text-paper/85 mt-2 text-sm leading-relaxed">{c.fix}</p>
              )}
              {r.status === 'fail' && r.detail && (
                <p className="text-mist mt-1 font-mono text-[11px] break-all">
                  {t.setup.detail}: {r.detail}
                </p>
              )}
            </li>
          );
        })}
        {!results && <li className="text-mist text-sm">{t.setup.checking}</li>}
      </ol>

      {allOk && (
        <p className="mt-5 rounded-xl bg-emerald-950/60 px-4 py-3 text-sm text-emerald-100 ring-1 ring-emerald-400/30">
          {t.setup.allGood}
        </p>
      )}

      <div className="mt-5">
        <Button variant="secondary" onClick={() => void run()} disabled={!results}>
          {t.setup.rerun}
        </Button>
      </div>

      {configured && redirectUrl && (
        <section className="bg-coal mt-10 rounded-2xl border border-white/5 p-4">
          <h2 className="font-medium">{t.setup.redirectTitle}</h2>
          <p className="text-mist mt-2 text-sm leading-relaxed">{t.setup.redirectBody}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="bg-ink min-w-0 flex-1 rounded-lg px-3 py-2 text-xs break-all">
              {redirectUrl}
            </code>
            <Button
              size="sm"
              onClick={async () => {
                const ok = await copyText(redirectUrl);
                toast(ok ? t.common.copied : t.errors.copy, ok ? 'success' : 'error');
              }}
            >
              {t.common.copyUrl}
            </Button>
          </div>
        </section>
      )}
    </main>
  );
}
