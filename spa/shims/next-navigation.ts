import { useMemo } from 'react';
import { useMemoryRouter } from '../router';

export function useRouter() {
  const { navigate, back } = useMemoryRouter();
  return useMemo(
    () => ({
      push: (href: string) => navigate(href),
      replace: (href: string) => navigate(href, true),
      back,
      refresh: () => {},
      prefetch: () => {},
    }),
    [navigate, back],
  );
}

export function usePathname(): string {
  return useMemoryRouter().href.split('?')[0]!;
}

export function useSearchParams(): URLSearchParams {
  const { href } = useMemoryRouter();
  return useMemo(() => new URLSearchParams(href.split('?')[1] ?? ''), [href]);
}
