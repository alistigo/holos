#!/usr/bin/env bash
set -euo pipefail

GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
RESET="\033[0m"

info()    { echo -e "${GREEN}[setup]${RESET} $*"; }
warn()    { echo -e "${YELLOW}[setup]${RESET} $*"; }
error()   { echo -e "${RED}[setup]${RESET} $*"; }

# ── 1. mise ──────────────────────────────────────────────────────────────────
if ! command -v mise &>/dev/null; then
  info "mise not found — installing..."
  curl https://mise.run | sh
  echo ""
  warn "mise installed. [Warning] Restart your shell, then re-run:"
  echo ""
  echo "    bash scripts/setup.sh"
  echo ""
  exit 0
fi

info "Installing tool versions via mise..."
mise install
info "mise tools ready."

# ── 1b. Cross-shell activation (sh / bash / zsh) ─────────────────────────────
# Goal: mise-managed tools resolve in every shell — interactive terminals,
# non-interactive scripts, IDE subshells (e.g. Claude Code Bash tool), cron, launchd.
#
# Strategy per shell:
#   1. Probe: grep the rc file for the activation marker (safe — no shell sourcing)
#   2. If found → skip (already wired)
#   3. If not found → append the activation line via ensure_contains
#      If the target file is not writable → warn + print a paste-able snippet
#
# Activation lines written when needed:
#   ~/.zshrc         eval "$(mise activate zsh)"          — interactive zsh
#   ~/.zshenv        PATH=~/.local/share/mise/shims:$PATH — non-interactive zsh subshells
#   ~/.bashrc        eval "$(mise activate bash)"         — interactive bash
#   ~/.bash_profile  [ -f ~/.bashrc ] && . ~/.bashrc      — login bash chains to bashrc
#   ~/.profile       PATH=~/.local/share/mise/shims:$PATH — sh login shells
#
# System-wide (/etc/paths.d/00-mise): covers fresh shells with no inherited PATH
# (cron, launchd, GUI app spawns). Requires sudo; skipped if unavailable.
#
# Note: `mise activate` requires hook support (zsh/bash/fish). For POSIX sh,
# only the shims PATH entry is needed — mise dispatches the right version via shims.
# Note: if asdf or Volta is installed, mise shims must come first in PATH.
# Note: probes use grep, not shell sourcing — sourcing interactive rc files can
#       hang (prompts), be slow (heavy plugins), or have side effects.

MISE_SHIMS="$HOME/.local/share/mise/shims"
MISE_BIN="$(command -v mise 2>/dev/null || echo "$HOME/.local/bin/mise")"

ensure_contains() {
  # Append $line to $file if $marker is not already present.
  # Gracefully handles unwritable files — warns + prints a paste-able snippet.
  local file="$1" marker="$2" line="$3"
  [ -f "$file" ] || { touch "$file" 2>/dev/null || { warn "Cannot create $file — skipping."; return; }; }
  grep -qF "$marker" "$file" && return
  if printf '\n%s\n' "$line" >> "$file" 2>/dev/null; then
    info "  wrote to $file"
  else
    warn "  Cannot write to $file (permission denied). Add this line manually:"
    echo "      $line"
  fi
}

# ── zsh ──────────────────────────────────────────────────────────────────────
if grep -qF "mise activate zsh" "$HOME/.zshrc" 2>/dev/null; then
  info "zsh: mise already active — skipping."
else
  info "zsh: mise not found in zsh startup — wiring..."
  ensure_contains "$HOME/.zshrc"  "mise activate zsh" "eval \"\$($MISE_BIN activate zsh)\""
  ensure_contains "$HOME/.zshenv" "mise/shims"        "export PATH=\"$MISE_SHIMS:\$PATH\""
fi

# ── bash ─────────────────────────────────────────────────────────────────────
if grep -qF "mise activate bash" "$HOME/.bashrc" 2>/dev/null; then
  info "bash: mise already active — skipping."
else
  info "bash: mise not found in bash startup — wiring..."
  ensure_contains "$HOME/.bashrc"       "mise activate bash" "eval \"\$($MISE_BIN activate bash)\""
  ensure_contains "$HOME/.bash_profile" ".bashrc"            "[ -f \"\$HOME/.bashrc\" ] && . \"\$HOME/.bashrc\""
fi

# ── sh ───────────────────────────────────────────────────────────────────────
if grep -qF "mise/shims" "$HOME/.profile" 2>/dev/null; then
  info "sh: mise shims already in ~/.profile — skipping."
else
  info "sh: mise shims not in ~/.profile — wiring..."
  ensure_contains "$HOME/.profile" "mise/shims" "export PATH=\"$MISE_SHIMS:\$PATH\""
fi

# ── system-wide (macOS path_helper) ──────────────────────────────────────────
if grep -qF "$MISE_SHIMS" /etc/paths.d/00-mise 2>/dev/null; then
  info "System PATH (/etc/paths.d/00-mise) already contains mise shims — skipping."
else
  if sudo -n true 2>/dev/null; then
    echo "$MISE_SHIMS" | sudo tee /etc/paths.d/00-mise > /dev/null
    info "Added /etc/paths.d/00-mise (system-wide PATH)."
  else
    warn "Skipping /etc/paths.d/00-mise (no passwordless sudo). To add manually:"
    echo "    echo \"$MISE_SHIMS\" | sudo tee /etc/paths.d/00-mise"
  fi
fi

# ── 2. Node workspace dependencies ───────────────────────────────────────────
# Use `mise exec` to ensure mise-managed pnpm is used (not intercepted by Volta)
info "Installing Node workspace dependencies..."
mise exec -- pnpm install
info "Node dependencies installed."

# ── 3. .claude/ symlinks ─────────────────────────────────────────────────────
# Wire repo .agents/ subdirectories into .claude/ so Claude skills, commands,
# PRDs, and epics are resolved from version-controlled paths.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
info "Wiring .claude/ symlinks..."
for pair in "skills:../.agents/skills" "commands:../.agents/commands" "prds:../.agents/prds" "epics:../.agents/epics"; do
  link="${pair%%:*}"
  target="${pair##*:}"
  dest="$REPO_ROOT/.claude/$link"
  if [ -L "$dest" ]; then
    info "  .claude/$link already symlinked — skipping."
  else
    ln -s "$target" "$dest"
    info "  .claude/$link → $target"
  fi
done

# ── 4. Claude memory symlink ──────────────────────────────────────────────────
# Points ~/.claude/projects/.../memory/ → .agents/memory/ so Claude's memory is git-tracked.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_SLUG="$(echo "$REPO_ROOT" | sed 's|/|-|g')"
CLAUDE_MEM_DIR="$HOME/.claude/projects/${REPO_SLUG}/memory"

if [ -L "$CLAUDE_MEM_DIR" ]; then
  info "Claude memory symlink already set up."
elif [ -d "$CLAUDE_MEM_DIR" ]; then
  warn "Claude memory dir exists but is not a symlink — backing up and replacing..."
  mv "$CLAUDE_MEM_DIR" "${CLAUDE_MEM_DIR}.bak"
  ln -s "$REPO_ROOT/.agents/memory" "$CLAUDE_MEM_DIR"
  info "Claude memory symlink created (old dir backed up to memory.bak)."
else
  mkdir -p "$(dirname "$CLAUDE_MEM_DIR")"
  ln -s "$REPO_ROOT/.agents/memory" "$CLAUDE_MEM_DIR"
  info "Claude memory symlink created → .agents/memory/"
fi

# ── 5. Docker ─────────────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  warn "Docker is not installed."
  echo ""
  echo "  Install Docker Desktop from:"
  echo "    https://docs.docker.com/get-docker/"
  echo ""
fi

# ── 6. Claude tools (git submodules) ─────────────────────────────────────────
info "Initialising Claude tool submodules (caveman, superpowers, ccpm)..."
git -C "$REPO_ROOT" submodule update --init --recursive
info "Submodules ready."

# Caveman: enable token compression by default
mkdir -p "$HOME/.claude"
if [ ! -f "$HOME/.claude/.caveman-active" ]; then
  touch "$HOME/.claude/.caveman-active"
  info "Caveman compression enabled (~/.claude/.caveman-active created)."
else
  info "Caveman already active — skipping."
fi

# CCPM requires an authenticated gh CLI
if ! command -v gh &>/dev/null; then
  warn "GitHub CLI (gh) not found — CCPM project management will not work."
  echo "  Install: https://cli.github.com/"
elif ! gh auth status &>/dev/null 2>&1; then
  warn "gh is not authenticated. Run: gh auth login"
else
  info "gh CLI authenticated."
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
info "Setup complete! Tool versions:"
echo "  node:    $(mise exec -- node --version 2>/dev/null || echo 'not found')"
echo "  bun:     $(mise exec -- bun --version 2>/dev/null || echo 'not found')"
echo "  pnpm:    $(mise exec -- pnpm --version 2>/dev/null || echo 'not found')"
echo "  docker:  $(docker --version 2>/dev/null || echo 'not installed')"
echo ""
info "You're ready to go. Run 'pnpm build' to build all projects."
