import { describe, expect, it } from 'vitest';
import { runSetupChecks, type SetupClient } from '@/lib/setup/checks';

type Err = { code?: string; message?: string } | null;

function fakeClient(opts: {
  missingTables?: boolean;
  missingColumns?: string[];
  noBucket?: boolean;
}): SetupClient {
  return {
    from: () => ({
      select: (columns: string) => ({
        limit: async (): Promise<{ error: Err }> => {
          if (opts.missingTables)
            return { error: { code: '42P01', message: 'relation does not exist' } };
          const missing = opts.missingColumns?.find((c) => columns.includes(c));
          return {
            error: missing ? { code: '42703', message: `column ${missing} does not exist` } : null,
          };
        },
      }),
    }),
    storage: {
      from: () => ({
        list: async (): Promise<{ error: Err }> => ({
          error: opts.noBucket ? { message: 'Bucket not found' } : null,
        }),
      }),
    },
  };
}

const status = (r: Awaited<ReturnType<typeof runSetupChecks>>) =>
  Object.fromEntries(r.map((c) => [c.id, c.status]));

describe('runSetupChecks', () => {
  it('reports missing environment variables and skips the rest', async () => {
    expect(status(await runSetupChecks(null, false))).toEqual({
      env: 'fail',
      tables: 'skip',
      artists: 'skip',
      videos: 'skip',
      profiles: 'skip',
      storage: 'skip',
    });
  });

  it('passes on a fully set-up project', async () => {
    const r = await runSetupChecks(fakeClient({}), true);
    expect(r.every((c) => c.status === 'ok')).toBe(true);
  });

  it('detects that setup.sql was never run', async () => {
    const r = status(
      await runSetupChecks(fakeClient({ missingTables: true, noBucket: true }), true),
    );
    expect(r).toMatchObject({ env: 'ok', tables: 'fail', artists: 'skip', storage: 'fail' });
  });

  it('detects an outdated setup (later migrations missing)', async () => {
    const r = status(
      await runSetupChecks(fakeClient({ missingColumns: ['video_url', 'avatar_url'] }), true),
    );
    expect(r).toMatchObject({ tables: 'ok', artists: 'ok', videos: 'fail', profiles: 'fail' });
  });
});
