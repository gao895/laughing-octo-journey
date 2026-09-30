/**
 * Setup diagnostics for the /setup page: verifies, with the public anon key only,
 * that the Supabase project is ready (tables, latest migrations, storage bucket).
 * Written against a tiny client interface so it can be unit-tested with fakes.
 */

export type CheckStatus = 'ok' | 'fail' | 'skip';

export interface CheckResult {
  id: 'env' | 'tables' | 'artists' | 'videos' | 'profiles' | 'storage';
  status: CheckStatus;
  /** Technical detail, shown small for whoever helps with the setup. */
  detail?: string;
}

interface QueryError {
  code?: string;
  message?: string;
}

export interface SetupClient {
  from(table: string): {
    select(columns: string): { limit(n: number): PromiseLike<{ error: QueryError | null }> };
  };
  storage: {
    from(bucket: string): {
      list(path: string, options: { limit: number }): PromiseLike<{ error: QueryError | null }>;
    };
  };
}

async function selectOk(client: SetupClient, table: string, columns: string) {
  try {
    const { error } = await client.from(table).select(columns).limit(1);
    return error
      ? { ok: false, detail: `${error.code ?? ''} ${error.message ?? ''}`.trim() }
      : { ok: true };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}

export async function runSetupChecks(
  client: SetupClient | null,
  configured: boolean,
): Promise<CheckResult[]> {
  if (!configured || !client) {
    return [
      { id: 'env', status: 'fail' },
      ...(['tables', 'artists', 'videos', 'profiles', 'storage'] as const).map((id) => ({
        id,
        status: 'skip' as const,
      })),
    ];
  }

  const results: CheckResult[] = [{ id: 'env', status: 'ok' }];

  const tables = await selectOk(client, 'galleries', 'id');
  results.push({ id: 'tables', status: tables.ok ? 'ok' : 'fail', detail: tables.detail });
  if (!tables.ok) {
    // Without the base tables the later checks only repeat the same failure.
    for (const id of ['artists', 'videos', 'profiles'] as const)
      results.push({ id, status: 'skip' });
  } else {
    // Columns added by later migrations: a missing one means setup.sql is outdated.
    const artists = await selectOk(client, 'galleries', 'artist_name');
    results.push({ id: 'artists', status: artists.ok ? 'ok' : 'fail', detail: artists.detail });
    const videos = await selectOk(client, 'artworks', 'video_url');
    results.push({ id: 'videos', status: videos.ok ? 'ok' : 'fail', detail: videos.detail });
    const profiles = await selectOk(client, 'profiles', 'avatar_url, bio');
    results.push({ id: 'profiles', status: profiles.ok ? 'ok' : 'fail', detail: profiles.detail });
  }

  try {
    const { error } = await client.storage.from('gallery-assets').list('', { limit: 1 });
    results.push({
      id: 'storage',
      status: error ? 'fail' : 'ok',
      detail: error ? `${error.code ?? ''} ${error.message ?? ''}`.trim() : undefined,
    });
  } catch (e) {
    results.push({
      id: 'storage',
      status: 'fail',
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  return results;
}
