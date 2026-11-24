#!/usr/bin/env bash
#
# Runs one Gherkin suite against its own `vite preview` of the dev playground.
#
#   run-e2e-suite.sh <port> <runner args...>
#
# Each suite owns a port, declared by its caller:
#
#   | Suite                                | Port |
#   |--------------------------------------|------|
#   | @alistigo/list-features              | 4173 |
#   | @alistigo/artifact-ai-draw-comments-features | 4174 |
#
# A new suite takes the next free number and is added to that table.
#
# Why this is a script rather than a one-liner in each project.json: the two
# suites used to start `vite preview` on the default port and point their runner
# at `http://localhost:4173` — both of them. CI runs `nx affected -t test:e2e`
# without a `--parallel` flag, so Nx runs up to three targets at once, and any
# change touching the playground or the harness makes both suites affected
# together. The second server then found 4173 taken, *silently relocated itself
# to 4174* (vite's default behaviour), and its runner spent the whole run talking
# to the first suite's server. Whichever suite finished first killed that server,
# and the other one died mid-scenario with `net::ERR_CONNECTION_REFUSED`. It is a
# race, so it passed locally and failed in CI about as often as not.
#
# Three things here prevent that recurring:
#   * the port comes from the caller, so two suites cannot pick the same one;
#   * `--strictPort` makes vite fail instead of relocating, so a collision is
#     loud and immediate rather than silent and confusing;
#   * the host handed to the runner is derived from that same port, so the server
#     and the client cannot disagree about which one they mean.

set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage: $(basename "$0") <port> <runner args...>" >&2
  exit 2
fi

PORT="$1"
shift

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLAYGROUND="${REPO_ROOT}/apps/alistigo-artifact-playground"
RUNNER="${REPO_ROOT}/cli/artifact-features-runner-playwright/dist/cli.js"
HOST="http://localhost:${PORT}"
READY_TIMEOUT_SECONDS=30

if [[ ! -f "$RUNNER" ]]; then
  echo "run-e2e-suite: $RUNNER is missing — build it first:" >&2
  echo "  pnpm nx run artifact-features-runner-playwright:build" >&2
  exit 1
fi

if [[ ! -d "${PLAYGROUND}/dist" ]]; then
  echo "run-e2e-suite: the playground has no production build — build it first:" >&2
  echo "  pnpm nx run alistigo-artifact-playground:build" >&2
  exit 1
fi

PREVIEW_LOG="$(mktemp -t "e2e-preview-${PORT}-XXXXXX.log")"

# vite directly, not through `pnpm exec`: $! is then the server itself, so the
# cleanup below actually stops it instead of killing a wrapper and orphaning the
# process that holds the port.
(cd "$PLAYGROUND" && exec ./node_modules/.bin/vite preview --port "$PORT" --strictPort) \
  >"$PREVIEW_LOG" 2>&1 &
PREVIEW_PID=$!

cleanup() {
  if kill -0 "$PREVIEW_PID" 2>/dev/null; then
    kill "$PREVIEW_PID" 2>/dev/null || true
    wait "$PREVIEW_PID" 2>/dev/null || true
  fi
  rm -f "$PREVIEW_LOG"
}
# On every exit path, not just the happy one: a failing suite, a timeout or a
# Ctrl-C used to leave the server running and the next run inherited its port.
trap cleanup EXIT INT TERM

server_died() {
  ! kill -0 "$PREVIEW_PID" 2>/dev/null
}

report_dead_server() {
  echo "run-e2e-suite: vite preview exited before serving ${HOST}." >&2
  echo "  Port ${PORT} is probably held by another process — check for a stray" >&2
  echo "  'vite preview' from an earlier run, or a dev server on the same port." >&2
  echo "  vite said:" >&2
  sed 's/^/    /' "$PREVIEW_LOG" >&2 || true
  exit 1
}

# Wait until the port answers *and* our own server is the one holding it.
#
# `curl` alone is not enough: a stray server on this port answers perfectly well,
# and accepting that answer is the exact mistake this script exists to prevent.
# `--strictPort` is what closes it — a live vite under that flag can only be
# holding the port we asked for, because the alternative is to exit. So "our
# process is alive" and "something answers on $PORT" together mean the thing
# answering is ours. Both halves are checked, and liveness is re-checked after
# the first successful response to rule out the narrow window where a squatter
# answered while our vite was still starting up and about to fail its bind.
#
# Deliberately not matched against vite's own banner: it prints the URL with
# ANSI colour codes inside it, so grepping for "localhost:$PORT" is formatting-
# dependent and silently stops matching when that formatting changes.
ready=0
for ((waited = 0; waited < READY_TIMEOUT_SECONDS; waited++)); do
  server_died && report_dead_server
  if curl -sf "$HOST" >/dev/null 2>&1; then
    sleep 1
    server_died && report_dead_server
    ready=1
    break
  fi
  sleep 1
done

if [[ "$ready" -ne 1 ]]; then
  echo "run-e2e-suite: ${HOST} did not answer within ${READY_TIMEOUT_SECONDS}s." >&2
  echo "  vite said:" >&2
  sed 's/^/    /' "$PREVIEW_LOG" >&2 || true
  exit 1
fi

# The runner's host is derived from the port this script bound, so the two can
# never point at different servers.
bun "$RUNNER" "$@" --host="$HOST"
