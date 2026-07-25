#!/usr/bin/env bash
#
# Wipes the database this project points at.
#
# Every table in the public schema is truncated, discovered at runtime rather
# than listed here - a hardcoded list silently goes stale the moment a model is
# added, which is how you end up with a "full" wipe that leaves rows behind.
#
# TRUNCATE ... CASCADE handles foreign keys itself, so there is no delete order
# to keep in sync with the schema either.
#
# Usage:
#   scripts/wipe-db.sh              # asks first
#   scripts/wipe-db.sh --dry-run    # show what would go, change nothing
#   scripts/wipe-db.sh --keep-auth  # leave users/accounts/sessions alone
#   scripts/wipe-db.sh --yes        # no prompt, for scripting

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

DRY_RUN=0
KEEP_AUTH=0
ASSUME_YES=0

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --keep-auth) KEEP_AUTH=1 ;;
    --yes|-y) ASSUME_YES=1 ;;
    -h|--help) sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "wipe-db: unknown option $arg" >&2; exit 2 ;;
  esac
done

# The worker and the web app share one database. Prefer the worker's env file
# since it holds a plain DATABASE_URL; the web app's is the same value.
for candidate in worker/.env web/.env; do
  if [ -z "${DATABASE_URL:-}" ] && [ -f "$candidate" ]; then
    set -a
    # shellcheck disable=SC1090
    . "./$candidate"
    set +a
  fi
done

if [ -z "${DATABASE_URL:-}" ]; then
  echo "wipe-db: DATABASE_URL is not set and neither worker/.env nor web/.env has it" >&2
  exit 1
fi

# Never echo the URL itself - it carries the password.
HOST=$(printf '%s' "$DATABASE_URL" | sed -E 's#.*@([^/?]+).*#\1#')
DBNAME=$(printf '%s' "$DATABASE_URL" | sed -E 's#.*/([^/?]+)(\?.*)?$#\1#')

AUTH_TABLES="'users','accounts','sessions','verification_tokens'"
if [ "$KEEP_AUTH" -eq 1 ]; then
  EXCLUDE="AND tablename NOT IN ($AUTH_TABLES)"
else
  EXCLUDE=""
fi

echo "database: $DBNAME"
echo "host:     $HOST"
[ "$KEEP_AUTH" -eq 1 ] && echo "keeping:  users, accounts, sessions, verification_tokens"
echo

echo "current contents:"
psql "$DATABASE_URL" -q -t -A -F' | ' <<SQL
SELECT tablename,
       (xpath('/row/c/text()',
              query_to_xml(format('SELECT count(*) AS c FROM %I.%I', schemaname, tablename),
                           false, true, '')))[1]::text::bigint AS rows
  FROM pg_tables
 WHERE schemaname = 'public' $EXCLUDE
 ORDER BY 2 DESC, 1;
SQL

if [ "$DRY_RUN" -eq 1 ]; then
  echo
  echo "dry run - nothing was deleted"
  exit 0
fi

if [ "$ASSUME_YES" -ne 1 ]; then
  echo
  read -r -p "Type 'wipe' to erase all of the above: " reply
  if [ "$reply" != "wipe" ]; then
    echo "aborted"
    exit 1
  fi
fi

# One statement, so it is a single transaction: either every table is emptied
# or none is. RESTART IDENTITY resets sequences that Prisma owns.
psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 <<SQL
DO \$\$
DECLARE
  stmt text;
BEGIN
  SELECT 'TRUNCATE TABLE '
         || string_agg(format('%I.%I', schemaname, tablename), ', ')
         || ' RESTART IDENTITY CASCADE'
    INTO stmt
    FROM pg_tables
   WHERE schemaname = 'public' $EXCLUDE;

  IF stmt IS NULL THEN
    RAISE NOTICE 'nothing to truncate';
  ELSE
    EXECUTE stmt;
  END IF;
END
\$\$;
SQL

echo "wiped."
