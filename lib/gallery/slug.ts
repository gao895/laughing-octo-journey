const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';

export function randomId(length = 8): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

/**
 * Builds a shareable slug such as `summer-memories-k3x9p2`.
 * Titles without latin characters (e.g. 日本語) get a short random slug like `k3x9p2ab`.
 * A random suffix is always added so two galleries with the same title never collide.
 */
export function createSlug(title: string): string {
  const base = title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
  return base.length >= 3 ? `${base}-${randomId(6)}` : randomId(8);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length <= 80;
}
