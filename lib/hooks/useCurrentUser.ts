'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { AppUser } from '@/types/profile';
import { getRepository } from '@/lib/data';
import { logDev } from '@/lib/errors';

interface UseCurrentUser {
  user: AppUser | null;
  loading: boolean;
}

/**
 * Loads the signed-in user. With `required`, signed-out visitors are sent to /login.
 * (In Supabase mode the proxy already blocks them on the server; this also covers demo mode.)
 */
export function useCurrentUser({ required = false } = {}): UseCurrentUser {
  const [state, setState] = useState<UseCurrentUser>({ user: null, loading: true });
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    getRepository()
      .getUser()
      .then((user) => {
        if (cancelled) return;
        setState({ user, loading: false });
        if (!user && required) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      })
      .catch((e) => {
        logDev('useCurrentUser', e);
        if (!cancelled) setState({ user: null, loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, [required, router, pathname]);

  return state;
}
