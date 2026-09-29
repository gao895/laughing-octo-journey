/** The browser build always runs in demo mode, so the Supabase client is never created. */
export function createBrowserClient(): never {
  throw new Error('Supabase is not available in the browser demo build');
}
export const createServerClient = createBrowserClient;
