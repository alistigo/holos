#!/usr/bin/env bash
# Activate mise and export tool paths for the Claude Code session.
# This runs once at session start via the SessionStart hook.
# Environment variables written to CLAUDE_ENV_FILE persist for all
# subsequent Bash tool calls in the session.
#
# Every value is written %q-quoted: CLAUDE_ENV_FILE is evaluated by a shell, so a raw
# `env` dump makes any value holding a space or `;` run as a command (NIX_PROFILES and
# LS_COLORS both do). Shims mode is used on purpose — `mise activate` installs a
# prompt hook whose unquoted output has the same problem on every single command.

if [ -n "$CLAUDE_ENV_FILE" ]; then
  eval "$(mise activate bash --shims 2>/dev/null)"
  env -0 | while IFS= read -r -d '' kv; do
    printf '%s=%q\n' "${kv%%=*}" "${kv#*=}"
  done >> "$CLAUDE_ENV_FILE"
fi
