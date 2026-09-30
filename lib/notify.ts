'use client';

const EVENT = 'mvg:notice';

/** Shows a toast from non-React code (e.g. the data layer). ToastProvider listens for it. */
export function notify(message: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: message }));
}

export function onNotify(listener: (message: string) => void): () => void {
  const handler = (e: Event) => listener((e as CustomEvent<string>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
