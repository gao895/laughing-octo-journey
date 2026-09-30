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

const USER_UPDATED = 'mvg:user-updated';

/** Tells every useCurrentUser() (e.g. the header) to reload after the profile changed. */
export function announceUserUpdated(): void {
  window.dispatchEvent(new Event(USER_UPDATED));
}

/**
 * Loads the signed-in user. With `required`, signed-out visitors are sent to /login.
 * (In Supabase mode the proxy already blocks them on the server; this also covers demo mode.)
 */
export function useCurrentUser({ required = false } = {}): UseCurrentUser {
  const [state, setState] = useState<UseCurrentUser>({ user: null, loading: true });
  const router = useRouter();
  const pathname = usePathname();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(USER_UPDATED, bump);
    return () => window.removeEventListener(USER_UPDATED, bump);
  }, []);

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
  }, [required, router, pathname, version]);

  return state;
}
