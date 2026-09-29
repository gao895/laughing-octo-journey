import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * In-memory router for the single-file browser build. Artifact pages cannot use URL
 * paths, so navigation is kept in React state; the Next.js APIs the app uses
 * (next/link, next/navigation) are replaced with shims that talk to this router.
 */
interface RouterValue {
  href: string;
  navigate: (href: string, replace?: boolean) => void;
  back: () => void;
}

const RouterContext = createContext<RouterValue | null>(null);

export function MemoryRouter({ initial, children }: { initial: string; children: ReactNode }) {
  const [stack, setStack] = useState<string[]>([initial]);
  const navigate = useCallback((href: string, replace = false) => {
    setStack((prev) => (replace ? [...prev.slice(0, -1), href] : [...prev, href]));
    window.scrollTo(0, 0);
  }, []);
  const back = useCallback(
    () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev)),
    [],
  );
  const value = useMemo(
    () => ({ href: stack[stack.length - 1]!, navigate, back }),
    [stack, navigate, back],
  );
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useMemoryRouter(): RouterValue {
  const value = useContext(RouterContext);
  if (!value) throw new Error('MemoryRouter missing');
  return value;
}
