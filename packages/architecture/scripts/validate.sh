#!/usr/bin/env bash
# Validates every CALM architecture/pattern file in @alistigo/architecture.
#
# Run from the package root (the `qa:arch-calm` Nx target sets cwd):
#   nx run architecture:qa:arch-calm
#
# The installed @finos/calm-cli (ADR 0027 §2) does not accept a bare directory
# argument to `calm validate` — each file must be passed explicitly via -a.
# The files under patterns/ are concrete node/relationship documents (not
# parametrised JSON-Schema patterns), so they validate as architectures too.

set -euo pipefail

shopt -s nullglob
files=(systems/*.arch.json patterns/*.pattern.json)

if (( ${#files[@]} == 0 )); then
  echo "ERROR: no CALM architecture files found in packages/architecture/"
  exit 1
fi

status=0
for f in "${files[@]}"; do
  echo "Validating $f"
  if ! pnpm calm validate -a "$f" --strict -f pretty; then
    status=1
  fi
done

if (( status != 0 )); then
  echo "ERROR: one or more CALM architecture files failed validation."
  exit 1
fi

echo "arch-calm: all CALM files valid. ✓"
