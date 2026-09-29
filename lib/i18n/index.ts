import { ja } from './ja';

/**
 * The active dictionary. The MVP is Japanese-only; to add a locale, create a
 * file with the same shape as `ja` and pick it here (e.g. from a cookie).
 */
export const t = ja;
export type { Dictionary } from './ja';
