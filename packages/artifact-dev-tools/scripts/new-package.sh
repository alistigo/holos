#!/usr/bin/env bash
# Scaffolds a new package under packages/<name>
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: bash packages/artifact-dev-tools/scripts/new-package.sh <name>"
  exit 1
fi

NAME="$1"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TEMPLATES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../templates/new-package" && pwd)"
PKG_DIR="$REPO_ROOT/packages/$NAME"

if [ -d "$PKG_DIR" ]; then
  echo "Error: packages/$NAME already exists"
  exit 1
fi

mkdir -p "$PKG_DIR/src"

# Render template files — substitute {{NAME}} placeholder
render_template() {
  local src="$1"
  local dst="$2"
  sed -e "s/{{NAME}}/$NAME/g" "$src" > "$dst"
}

render_template "$TEMPLATES_DIR/package.json"  "$PKG_DIR/package.json"
render_template "$TEMPLATES_DIR/project.json"  "$PKG_DIR/project.json"
render_template "$TEMPLATES_DIR/README.md"     "$PKG_DIR/README.md"

# Static files copied as-is
cp "$TEMPLATES_DIR/tsconfig.json"    "$PKG_DIR/tsconfig.json"
cp "$TEMPLATES_DIR/src/index.ts"     "$PKG_DIR/src/index.ts"
cp "$REPO_ROOT/LICENSE"              "$PKG_DIR/LICENSE"

echo "Created packages/$NAME"
echo "Next steps:"
echo "  1. Set alistigo.type in packages/$NAME/package.json"
echo "  2. Run 'pnpm install' to link the new package in the workspace"
