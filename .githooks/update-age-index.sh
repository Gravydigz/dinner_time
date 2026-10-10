#!/bin/bash
# .githooks/update-age-index.sh — wrapper; the real script lives in the
# secrets-process repo (github.com/Gravydigz/secrets-process). Run it by hand
# from the repo root. Don't edit this file: fix the script there.
H="${SECRETS_PROCESS_DIR:-$HOME/.secrets-process}/hooks/update-age-index.sh"
[ -x "$H" ] || { echo "update-age-index: secrets-process not found at $H (clone github.com/Gravydigz/secrets-process there, or set SECRETS_PROCESS_DIR)" >&2; exit 1; }
exec "$H" "$@"
