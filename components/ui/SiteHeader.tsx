'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { getRepository } from '@/lib/data';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { t } from '@/lib/i18n';
import { buttonClass } from './Button';

export function SiteHeader() {
  const { user, loading } = useCurrentUser();
  const router = useRouter();
  const demo = !isSupabaseConfigured();

  async function logout() {
    await getRepository().signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="bg-ink/80 sticky top-0 z-40 border-b border-white/5 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-wide">
          <span aria-hidden className="text-gold">
            ◆
          </span>
          <span className="hidden sm:inline">{t.app.name}</span>
          <span className="sm:hidden">MVG</span>
          {demo && (
            <span className="bg-gold/10 text-gold ring-gold/30 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1">
              {t.common.demoBadge}
            </span>
          )}
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/explore" className={buttonClass('ghost', 'sm')}>
            {t.home.explore}
          </Link>
          {!loading &&
            (user ? (
              <>
                <Link href="/dashboard" className={buttonClass('secondary', 'sm')}>
                  {t.common.dashboard}
                </Link>
                <button type="button" onClick={logout} className={buttonClass('ghost', 'sm')}>
                  {t.common.logout}
                </button>
              </>
            ) : (
              <Link href="/login" className={buttonClass('secondary', 'sm')}>
                {t.auth.loginTitle}
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}
