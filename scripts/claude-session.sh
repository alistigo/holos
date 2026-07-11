#!/usr/bin/env bash
# Start or reattach to a persistent tmux session running Claude Code
set -euo pipefail

SESSION="${1:-claude}"

if ! command -v tmux >/dev/null 2>&1; then
  echo "Error: tmux is not installed. Install it with 'sudo apt-get install tmux' (or your distro's equivalent) and try again."
  exit 1
fi

if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "Reattaching to existing session '$SESSION'..."
  exec tmux attach-session -t "$SESSION"
fi

echo "Starting new persistent session '$SESSION'..."
tmux new-session -d -s "$SESSION" "claude"
tmux set-option -t "$SESSION" remain-on-exit on

echo "Detach with Ctrl+b d (or just close the terminal/laptop) — the session and Claude keep running on this server."
echo "Reattach any time with: bash scripts/claude-session.sh $SESSION"
exec tmux attach-session -t "$SESSION"
