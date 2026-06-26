#!/usr/bin/env bash
# Wrapper for the superpowers SessionStart hook.
# Sets CLAUDE_PLUGIN_ROOT so the hook can locate its skills directory.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export CLAUDE_PLUGIN_ROOT="${REPO_ROOT}/vendor/superpowers"

if [[ ! -d "${CLAUDE_PLUGIN_ROOT}" ]]; then
  echo "Warning: superpowers vendor directory not found at ${CLAUDE_PLUGIN_ROOT}; skipping SessionStart hook." >&2
  exit 0
fi

if [[ ! -f "${CLAUDE_PLUGIN_ROOT}/hooks/session-start" ]]; then
  echo "Warning: superpowers SessionStart hook not found at ${CLAUDE_PLUGIN_ROOT}/hooks/session-start; skipping." >&2
  exit 0
fi

exec bash "${CLAUDE_PLUGIN_ROOT}/hooks/session-start"
