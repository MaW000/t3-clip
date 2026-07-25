#!/usr/bin/env bash
#
# Starts the Python ingest worker for local development.
#
# The worker has no dependency manager of its own - it is a plain requirements.txt
# that Railway installs into a Docker image. This script does the equivalent
# locally so `npm run dev` at the repo root can bring both halves up together.
#
# It is idempotent: the virtualenv and its packages are only built when missing
# or out of date.

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../worker"

VENV=.venv
STAMP="$VENV/.deps-installed"

# Ubuntu and WSL images routinely ship python3 without the python3-venv package,
# which makes `python3 -m venv` produce a broken environment. uv carries its own
# and is much faster, so it is preferred when present.
if command -v uv >/dev/null 2>&1; then
  [ -d "$VENV" ] || uv venv "$VENV"
  if [ ! -f "$STAMP" ] || [ requirements.txt -nt "$STAMP" ]; then
    echo "worker: installing dependencies"
    uv pip install -q -r requirements.txt --python "$VENV/bin/python"
    touch "$STAMP"
  fi
elif python3 -m venv --help >/dev/null 2>&1; then
  [ -d "$VENV" ] || python3 -m venv "$VENV"
  if [ ! -f "$STAMP" ] || [ requirements.txt -nt "$STAMP" ]; then
    echo "worker: installing dependencies"
    "$VENV/bin/pip" install -q -r requirements.txt
    touch "$STAMP"
  fi
else
  echo "worker: need either uv (https://docs.astral.sh/uv/) or python3-venv" >&2
  echo "worker: install one with 'sudo apt install python3-venv'" >&2
  exit 1
fi

# The worker reads plain environment variables - it does not load .env itself,
# because on Railway these arrive as service variables. Locally they live in
# worker/.env, so source it here.
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "worker: DATABASE_URL is not set - add it to worker/.env" >&2
  exit 1
fi

exec "$VENV/bin/python" main.py
