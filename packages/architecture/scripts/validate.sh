#!/usr/bin/env bash
# Validates every CALM architecture/pattern file in @alistigo/architecture,
# plus artifact implementations that live in other packages.
#
# Run from the package root (the `qa:arch-calm` Nx target sets cwd):
#   nx run architecture:qa:arch-calm
#
# Validation modes (CALM CLI v1.58.0):
#   calm validate -p <pattern>            — validate pattern against CALM schema
#   calm validate -a <arch>               — validate architecture against CALM schema
#   calm validate -p <pattern> -a <arch>  — validate architecture against pattern

set -euo pipefail

shopt -s nullglob

status=0

# --- Validate systems (concrete architectures) ---
arch_files=(systems/*.arch.json)
if (( ${#arch_files[@]} == 0 )); then
  echo "ERROR: no CALM architecture files found in systems/"
  exit 1
fi

for f in "${arch_files[@]}"; do
  echo "Validating architecture $f"
  if ! pnpm calm validate -a "$f" --strict -f pretty; then
    status=1
  fi
done

# --- Validate patterns (JSON-Schema CALM patterns) ---
pattern_files=(patterns/*.pattern.json)
for f in "${pattern_files[@]}"; do
  echo "Validating pattern $f"
  if ! pnpm calm validate -p "$f" --strict -f pretty; then
    status=1
  fi
done

# --- Validate artifact implementations against the base pattern ---
# Each implementation lives in its own package under ../../packages/<name>/.
impl_files=(../../packages/list-domain/artifact-list.arch.json)
pattern="patterns/alistigo-artifact.pattern.json"

for f in "${impl_files[@]}"; do
  echo "Validating implementation $f (standalone)"
  if ! pnpm calm validate -a "$f" --strict -f pretty; then
    status=1
  fi
  echo "Validating implementation $f against pattern $pattern"
  if ! pnpm calm validate -p "$pattern" -a "$f" --strict -f pretty; then
    status=1
  fi
done

if (( status != 0 )); then
  echo "ERROR: one or more CALM files failed validation."
  exit 1
fi

echo "arch-calm: all CALM files valid. ✓"
