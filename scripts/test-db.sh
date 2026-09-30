#!/usr/bin/env bash
# Tests the Supabase migrations and Row Level Security on a throwaway local PostgreSQL.
#
#   npm run test:db
#
# Needs PostgreSQL server binaries (initdb / pg_ctl, e.g. `apt install postgresql`).
# A small stand-in for Supabase's auth/storage schemas is loaded first
# (supabase/tests/supabase_shim.sql); this never touches a real Supabase project.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PG_BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
[ -x "$PG_BIN/initdb" ] || { echo "PostgreSQL server binaries not found (set PG_BIN)"; exit 1; }

WORK="$(mktemp -d)"
PORT="${PGTEST_PORT:-54329}"
RUN=()
# initdb refuses to run as root: use the postgres system user when needed.
if [ "$(id -u)" = "0" ]; then
  chown -R postgres "$WORK"
  RUN=(runuser -u postgres --)
fi
cleanup() { "${RUN[@]}" "$PG_BIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT

"${RUN[@]}" "$PG_BIN/initdb" -D "$WORK/data" -U postgres -A trust >/dev/null
"${RUN[@]}" "$PG_BIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses=''" -l "$WORK/log" -w start >/dev/null

PSQL=("${RUN[@]}" psql -X -q -t -A -v ON_ERROR_STOP=1 -h "$WORK" -p "$PORT" -U postgres -d postgres)

"${PSQL[@]}" -f "$ROOT/supabase/tests/supabase_shim.sql" >/dev/null

# Apply every migration twice, in order, to prove they can be re-run safely.
for pass in 1 2; do
  for f in "$ROOT"/supabase/migrations/*.sql; do
    "${PSQL[@]}" -f "$f" >/dev/null 2>"$WORK/err" || { cat "$WORK/err"; echo "migration failed: $(basename "$f") (pass $pass)"; exit 1; }
  done
done
echo "✓ migrations apply cleanly (and re-apply)"

# The one-file setup for the SQL Editor must match the migrations and apply on a fresh DB.
node "$ROOT/scripts/build-setup-sql.mjs" --check
"${RUN[@]}" "$PG_BIN/createdb" -h "$WORK" -p "$PORT" -U postgres fresh
FRESH=("${RUN[@]}" psql -X -q -t -A -v ON_ERROR_STOP=1 -h "$WORK" -p "$PORT" -U postgres -d fresh)
"${FRESH[@]}" -f "$ROOT/supabase/tests/supabase_shim.sql" >/dev/null 2>&1
"${FRESH[@]}" -f "$ROOT/supabase/setup.sql" >/dev/null 2>"$WORK/err" || { cat "$WORK/err"; echo "setup.sql failed"; exit 1; }
"${FRESH[@]}" -f "$ROOT/supabase/setup.sql" >/dev/null 2>"$WORK/err" || { cat "$WORK/err"; echo "setup.sql failed on re-run"; exit 1; }
echo "✓ supabase/setup.sql sets up a fresh database (and can be run again)"

"${PSQL[@]}" -f "$ROOT/supabase/tests/grants.sql" >/dev/null
"${PSQL[@]}" -f "$ROOT/supabase/tests/rls_test.sql" 2>&1 | sed -e 's/^psql:[^ ]* NOTICE:  /  /' | grep -v -e '^$' -e '^{"sub"'
