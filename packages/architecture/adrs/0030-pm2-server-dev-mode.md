# ADR 0030 — PM2 Server Dev Mode

**Status:** Accepted  
**Date:** 2026-09-14

## Context

The repository runs on a remote Linux server (accessed via VS Code Remote / Codespace) to support long-lived Claude AI sessions in tmux. Dev servers — playground (Vite), website (Astro), and Storybook — need to:

- Outlive SSH disconnects without being killed
- Survive branch switches (restart automatically when the branch changes)
- Auto-restart on crash without manual intervention
- Be accessible over LAN/Tailscale from other devices

The existing `pnpm dev` command runs foreground processes tied to the terminal session — suitable for local development, not for persistent server use.

## Decision

Use **PM2** as the background process manager for server-mode dev. Introduce a `server:*` script namespace in the root `package.json` to make server-mode commands clearly distinct from the `dev` foreground command. Provide `server:install-service` to install a systemd user service for boot-time persistence.

The PM2 ecosystem config lives at `pm2.ecosystem.config.cjs` (CJS required — PM2 does not support ESM config files).

All managed processes use `interpreter: "none"` because `pnpm` is a bash script, not a Node.js file — PM2 would otherwise try to run it through Node.js and fail with a syntax error.

All processes bind to `--host 0.0.0.0` for LAN/Tailscale accessibility.

## Rationale

- **Named processes** — `pm2 status` gives a clear live view of all running services
- **Crash restart** — `autorestart: true` handles unexpected failures
- **Unified logs** — `pm2 logs` streams all processes; individual logs at `~/.pm2/logs/`
- **No Docker overhead** — Docker adds networking complexity for a single-developer server setup
- **`server:` prefix** — keeps these scripts clearly separated from the local-dev `pnpm dev` workflow; discoverability via `pnpm run | grep server`

The systemd user service (`scripts/install-dev-service.sh`) enables boot-time persistence without `sudo`. It uses `Type=oneshot` + `RemainAfterExit=yes` because PM2 daemonizes itself and the start command exits immediately — `Type=forking` is incorrect here. The service installer injects the mise shims directory into `Environment=PATH=` because systemd does not source shell profiles.

## Consequences

- New root devDependency: `pm2 ^5.4.0`
- `.cjs` config file at repo root (cannot be ESM)
- `loginctl enable-linger <user>` needed for true boot-without-login persistence (service installer calls it automatically, with a fallback message if unavailable)
- `websites/alistigo` and `websites/storybook` must exist for those PM2 processes to start; `playground` works independently

## Alternatives Rejected

| Option | Why rejected |
|--------|-------------|
| `nohup <cmd> &` | No crash restart, no log management, no status dashboard |
| tmux session | Lost on server reboot; manual reconnect required |
| Docker Compose | Networking overhead; port mapping complexity; overkill for a solo dev server |
| systemd unit per process | More boilerplate; PM2 already provides the daemon layer cleanly |
