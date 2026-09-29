import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';

export default function dynamic<P extends object>(
  loader: () => Promise<ComponentType<P>>,
  options: { loading?: () => ReactNode; ssr?: boolean } = {},
): ComponentType<P> {
  const Lazy = lazy(async () => ({ default: await loader() }));
  function Dynamic(props: P) {
    return (
      <Suspense fallback={options.loading?.() ?? null}>
        <Lazy {...props} />
      </Suspense>
    );
  }
  return Dynamic;
}
