#!/usr/bin/env bash
# Runs the Playwright integration test suite against a locally started dev server.
#
# Responsibilities:
#   1. Kill any stale process on port 5173 left by a previous interrupted run.
#   2. Start alistigo-artifact-playground:dev in the background.
#   3. Wait until port 5173 is accepting connections.
#   4. Run the Cucumber/Playwright feature tests.
#   5. Kill the dev server on exit — whether tests finished normally, the user
#      pressed Ctrl-C, or lefthook killed this script mid-run (SIGTERM).
#
# Dependencies:
#   trap  — bash builtin, always available.
#   fuser — from psmisc; available on ubuntu-latest CI and standard Ubuntu.
#             Checked at runtime; falls back to lsof (macOS / Alpine friendly).

set -euo pipefail

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
    # xargs -r skips execution when stdin is empty (nothing on the port).
    lsof -ti:"${port}" 2>/dev/null | xargs -r kill -9 2>/dev/null || true
  else
    echo "[warn] Neither fuser nor lsof found; skipping pre-flight port kill." >&2
  fi
}

# cleanup
# Called by the EXIT/INT/TERM trap. Kills the background dev server (job %1).
# Errors are suppressed: the server may have already exited by the time the
# trap fires, or it may never have started (e.g. set -e fired before the &).
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

# Kill any leftover dev server from a previous interrupted run. Without this,
# Vite finds port 5173 occupied, silently picks 5174, and the readiness loop
# below waits on 5173 forever.
kill_port 5173

# Start the dev server in the background. Nx resolves the build dependencies
# (declared via dependsOn in project.json) before starting the server.
nx run alistigo-artifact-playground:dev &

# Poll until the server is ready. curl -sf returns 0 as soon as the server
# responds with any HTTP status (including 404 from the SPA index route).
until curl -sf http://localhost:5173 > /dev/null; do sleep 1; done

# Run all Gherkin/Playwright scenarios. The exit code of this command becomes
# the exit code of the script (bash preserves the last foreground command's
# exit code through the EXIT trap).
nx run list-features-runner-playwright:run-all-features
