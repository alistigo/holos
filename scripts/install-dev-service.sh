#!/usr/bin/env bash
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="alistigo-dev"
SERVICE_FILE="$HOME/.config/systemd/user/${SERVICE_NAME}.service"
MISE_SHIMS="${HOME}/.local/share/mise/shims"

if [ ! -d "$MISE_SHIMS" ]; then
  echo "Error: mise shims directory not found at ${MISE_SHIMS}"
  exit 1
fi

PNPM_BIN="${MISE_SHIMS}/pnpm"
if [ ! -f "$PNPM_BIN" ]; then
  echo "Error: pnpm shim not found at ${PNPM_BIN}"
  exit 1
fi

SERVICE_PATH="${MISE_SHIMS}:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

mkdir -p "$HOME/.config/systemd/user"

cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Alistigo Dev Services (PM2)
After=network.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${REPO_ROOT}
Environment=PATH=${SERVICE_PATH}
ExecStart=${PNPM_BIN} run server:start:dev
ExecStop=${PNPM_BIN} run server:kill-all

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable "$SERVICE_NAME"
loginctl enable-linger "$USER" 2>/dev/null || echo "(Note: 'loginctl enable-linger' skipped — run with sudo if you want boot-without-login)"
echo "Service installed at: ${SERVICE_FILE}"
echo "Start now:  systemctl --user start ${SERVICE_NAME}"
