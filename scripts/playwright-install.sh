#!/usr/bin/env bash
# Runs `playwright <args...>` with a browsers path that can actually be written to.
#
# Without this, a machine-wide PLAYWRIGHT_BROWSERS_PATH pointing at a read-only
# directory (a /nix/store path, for instance) makes `playwright install` block on the
# registry lock forever instead of failing — it looks like the command does nothing.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE="@alistigo/artifact-features-runner-playwright"
DEFAULT_PATH="${XDG_CACHE_HOME:-$HOME/.cache}/ms-playwright"

# Reads one key out of the repo .env. Never sources or evals the file.
read_dotenv_value() {
  local key="$1" file="$ROOT/.env" line value
  [ -f "$file" ] || return 0
  line="$(grep -E "^[[:space:]]*(export[[:space:]]+)?${key}=" "$file" | tail -1 || true)"
  [ -n "$line" ] || return 0
  value="${line#*=}"
  value="${value%\"}" ; value="${value#\"}"
  value="${value%\'}" ; value="${value#\'}"
  printf '%s' "$value"
}

target="$(read_dotenv_value PLAYWRIGHT_BROWSERS_PATH)"
[ -n "$target" ] || target="${PLAYWRIGHT_BROWSERS_PATH:-}"
[ -n "$target" ] || target="$DEFAULT_PATH"

if [ "$target" != "0" ]; then
  mkdir -p "$target" 2>/dev/null || true
  if [ ! -w "$target" ]; then
    echo "playwright: $target is not writable — falling back to $DEFAULT_PATH" >&2
    target="$DEFAULT_PATH"
    mkdir -p "$target" 2>/dev/null || true
  fi
  if [ ! -w "$target" ]; then
    echo "playwright: cannot write to $target — set PLAYWRIGHT_BROWSERS_PATH in $ROOT/.env to a writable directory." >&2
    exit 1
  fi
  export PLAYWRIGHT_BROWSERS_PATH="$target"
  echo "playwright: PLAYWRIGHT_BROWSERS_PATH=$target"
fi

exec pnpm --filter "$PACKAGE" exec playwright "$@"
