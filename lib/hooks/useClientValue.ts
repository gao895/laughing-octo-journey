'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** Reads a browser-only value without hydration mismatches (server renders `serverValue`). */
export function useClientValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(subscribe, read, () => serverValue);
}
