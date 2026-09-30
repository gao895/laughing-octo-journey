/**
 * Concatenates supabase/migrations/*.sql (in order) into supabase/setup.sql, so the whole
 * database can be set up by pasting ONE file into the Supabase SQL Editor.
 *
 *   node scripts/build-setup-sql.mjs          -> writes supabase/setup.sql
 *   node scripts/build-setup-sql.mjs --check  -> fails if setup.sql is out of date
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dir = path.join(root, 'supabase/migrations');
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const parts = [
  '-- =====================================================================',
  '-- My Virtual Gallery - complete database setup (generated, do not edit)',
  '-- Paste this whole file into Supabase > SQL Editor and press Run.',
  '-- Safe to run again: every step checks what already exists.',
  '-- Source: supabase/migrations/*.sql  (npm run db:setup-sql)',
  '-- =====================================================================',
  '',
];
for (const f of files) {
  parts.push(`-- >>> ${f}`, readFileSync(path.join(dir, f), 'utf8').trimEnd(), '');
}
const sql = parts.join('\n');
const out = path.join(root, 'supabase/setup.sql');

if (process.argv.includes('--check')) {
  if (!existsSync(out) || readFileSync(out, 'utf8') !== sql) {
    console.error('supabase/setup.sql is out of date: run `npm run db:setup-sql`');
    process.exit(1);
  }
  console.log('✓ supabase/setup.sql is up to date');
} else {
  writeFileSync(out, sql);
  console.log(`wrote supabase/setup.sql (${files.length} migrations)`);
}
