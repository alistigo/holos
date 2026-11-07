#!/usr/bin/env bash
# Runs the Playwright integration test suite against a dev server.
#
# Two modes:
#
#   ALISTIGO_APP_URL set   — Use an already-running playground at that URL.
#                            Validates the server is reachable; exits with an
#                            error if it is not (never tries to start one).
#
#   ALISTIGO_APP_URL unset — Kill any stale process on port 5173, start
#                            alistigo-artifact-playground:dev, wait for it to
#                            be ready, then run the tests.
#
# Dependencies:
#   trap  — bash builtin, always available.
#   fuser — from psmisc; available on ubuntu-latest CI and standard Ubuntu.
#             Checked at runtime; falls back to lsof (macOS / Alpine friendly).

set -euo pipefail

# ---------------------------------------------------------------------------
# Load .env from the same directory as this script (if present).
# This allows ALISTIGO_APP_URL to be set without exporting it in the shell.
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a; source "$SCRIPT_DIR/.env"; set +a
fi

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# kill_port <port>
# Kills all processes bound to <port>/tcp. Prefers fuser (one call, reliable
# signal delivery to child processes). Falls back to lsof. Warns and continues
# if neither tool is present — on a fresh environment there is nothing to kill.
kill_port() {
  local port=$1
  if command -v fuser &>/dev/null; then
    fuser -k "${port}/tcp" 2>/dev/null || true
  elif command -v lsof &>/dev/null; then
    lsof -ti:"${port}" 2>/dev/null | xargs -r kill -9 2>/dev/null || true
  else
    echo "[warn] Neither fuser nor lsof found; skipping pre-flight port kill." >&2
  fi
}

# cleanup
# Called by the EXIT/INT/TERM trap. Kills the background dev server (job %1)
# only when this script started one. When using a pre-existing server the
# kill is a no-op because there is no background job.
cleanup() {
  kill %1 2>/dev/null || true
  wait %1 2>/dev/null || true
}

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

# set -m enables job control mode: each background job gets its own process
# group. This is required for kill %1 to reliably terminate the full Vite
# subtree (pnpm → node → vite) rather than just the top-level shell.
set -m

# Register cleanup to run on any exit path so the dev server is never left
# running after this script finishes or is interrupted.
trap cleanup EXIT INT TERM

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if [ -n "${ALISTIGO_APP_URL:-}" ]; then
  # -------------------------------------------------------------------------
  # Pre-configured URL: validate it and use it as-is.
  # We never start a dev server here — if the URL is unreachable it means the
  # playground isn't running, and the caller should fix that before re-running.
  # -------------------------------------------------------------------------
  echo "Using pre-configured playground at ALISTIGO_APP_URL=$ALISTIGO_APP_URL"

  if ! curl -sf "$ALISTIGO_APP_URL" > /dev/null 2>&1; then
    echo "" >&2
    echo "  ERROR: ALISTIGO_APP_URL is set to '$ALISTIGO_APP_URL' but the server is not responding." >&2
    echo "  Start the playground first (e.g. pnpm nx run alistigo-artifact-playground:dev)" >&2
    echo "  or unset ALISTIGO_APP_URL to let this script start one automatically." >&2
    echo "" >&2
    exit 1
  fi

  echo "Server is reachable at $ALISTIGO_APP_URL"
else
  # -------------------------------------------------------------------------
  # No URL given: start a fresh dev server on port 5173.
  # Kill any leftover process on 5173 first so Vite always gets that port.
  # -------------------------------------------------------------------------
  kill_port 5173
  export ALISTIGO_APP_URL="http://localhost:5173"

  pnpm nx run alistigo-artifact-playground:dev &

  # Poll until the server is ready.
  until curl -sf "$ALISTIGO_APP_URL" > /dev/null 2>&1; do sleep 1; done
  echo "Dev server ready at $ALISTIGO_APP_URL"
fi

# Run all Gherkin/Playwright scenarios. The exit code of this command becomes
# the exit code of the script (bash preserves the last foreground command's
# exit code through the EXIT trap).
pnpm nx run list-features-runner-playwright:run-all-features
