# Hooks

Shell scripts that run at specific Claude Code lifecycle events.

## How It Works

Hooks are registered in `.claude/settings.json` under the `hooks` key. Claude Code invokes them at the configured event.

## Available Hooks

### `session-start.sh`

**Event:** `SessionStart` (runs once when a conversation begins)

Activates `mise` and writes the resulting environment variables to `CLAUDE_ENV_FILE`. This makes `bun`, `pnpm`, `node`, and other mise-managed tools available to all Bash commands in the session without manual activation.

## Directory Convention

Hook scripts live here in `ai/hooks/` (source of truth). `.claude/` references them directly — no copy or symlink needed since hooks are configured by path in `settings.json`.
