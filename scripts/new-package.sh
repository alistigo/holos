#!/usr/bin/env bash
# Scaffolds a new package under packages/<name>
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: bash scripts/new-package.sh <name>"
  exit 1
fi

NAME="$1"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PKG_DIR="$REPO_ROOT/packages/$NAME"

if [ -d "$PKG_DIR" ]; then
  echo "Error: packages/$NAME already exists"
  exit 1
fi

mkdir -p "$PKG_DIR/src"

# src/index.ts
cat > "$PKG_DIR/src/index.ts" <<EOF
export {};
EOF

# package.json
cat > "$PKG_DIR/package.json" <<EOF
{
  "name": "@mlabrut/$NAME",
  "version": "0.1.0",
  "private": false,
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "publishConfig": {
    "access": "public"
  }
}
EOF

# tsconfig.json
cat > "$PKG_DIR/tsconfig.json" <<EOF
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# project.json (Nx)
cat > "$PKG_DIR/project.json" <<EOF
{
  "name": "$NAME",
  "\$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/$NAME/src",
  "projectType": "library",
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "packages/$NAME/dist",
        "tsConfig": "packages/$NAME/tsconfig.json",
        "main": "packages/$NAME/src/index.ts"
      }
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc -p tsconfig.json --noEmit",
        "cwd": "packages/$NAME"
      }
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "biome check .",
        "cwd": "packages/$NAME"
      }
    },
    "clean": {
      "executor": "nx:run-commands",
      "options": {
        "command": "rm -rf dist",
        "cwd": "packages/$NAME"
      }
    }
  }
}
EOF

# README.md
cat > "$PKG_DIR/README.md" <<EOF
# @mlabrut/$NAME

> TODO: describe this package.

## Install

\`\`\`sh
pnpm add @mlabrut/$NAME
\`\`\`

## Usage

\`\`\`ts
import {} from "@mlabrut/$NAME";
\`\`\`
EOF

echo "Created packages/$NAME"
echo "Run 'pnpm install' to link the new package in the workspace."
