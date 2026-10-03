#!/usr/bin/env bash
# Generates CALM documentation sites from every architecture/pattern file.
# Each file gets its own sub-directory under the target output root.
#
# Run from the package root (the `arch-docify` Nx target sets cwd):
#   nx run architecture:arch-docify
#
# Output: ../../websites/alistigo/public/architecture/<unique-id>/

set -euo pipefail

OUTPUT_ROOT=".calm-docs"

shopt -s nullglob
files=(systems/*.arch.json patterns/*.pattern.json)

if (( ${#files[@]} == 0 )); then
  echo "ERROR: no CALM architecture files found in packages/architecture/"
  exit 1
fi

mkdir -p "$OUTPUT_ROOT"

for f in "${files[@]}"; do
  # Derive the output sub-directory from the file's unique-id field.
  id=$(node -e "process.stdout.write(require('./$f')['unique-id'])")
  out="$OUTPUT_ROOT/$id"
  echo "Docifying $f → $out"
  pnpm calm docify -a "$f" -o "$out" --clear-output-directory
done

echo "arch-docify: all CALM files documented. ✓"
