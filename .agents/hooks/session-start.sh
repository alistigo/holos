#!/usr/bin/env bash
# Activate mise and export tool paths for the Claude Code session.
# This runs once at session start via the SessionStart hook.
# Environment variables written to CLAUDE_ENV_FILE persist for all
# subsequent Bash tool calls in the session.

if [ -n "$CLAUDE_ENV_FILE" ]; then
  eval "$(mise activate bash 2>/dev/null)"
  eval "$(mise env -s bash 2>/dev/null)"
  env >> "$CLAUDE_ENV_FILE"

  # Caveman: signal compression mode when the user has enabled the flag
  if [ -f "$HOME/.claude/.caveman-active" ]; then
    printf 'CAVEMAN_ACTIVE=1\n' >> "$CLAUDE_ENV_FILE"
  fi
fi
