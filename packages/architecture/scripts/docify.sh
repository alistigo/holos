#!/usr/bin/env bash
# Generates CALM documentation sites from every architecture file.
# Each file gets its own sub-directory under the output root.
#
# Run from the package root (the `arch-docify` Nx target sets cwd):
#   nx run architecture:arch-docify
#
# Output: .calm-docs/<unique-id>/
#
# Note: only .arch.json files are docified — .pattern.json files are JSON-Schema
# documents, not CALM architecture instances, and calm docify expects the latter.

set -euo pipefail

OUTPUT_ROOT=".calm-docs"

shopt -s nullglob
# Architecture files in this package
arch_files=(systems/*.arch.json)
# Architecture files in other packages that implement the alistigo-artifact pattern
extra_arch_files=(../../packages/list-domain/artifact-list.arch.json)

all_files=("${arch_files[@]}" "${extra_arch_files[@]}")

if (( ${#all_files[@]} == 0 )); then
  echo "ERROR: no CALM architecture files found"
  exit 1
fi

mkdir -p "$OUTPUT_ROOT"

for f in "${all_files[@]}"; do
  id=$(node -e "process.stdout.write(require('./$f')['unique-id'])")
  out="$OUTPUT_ROOT/$id"
  echo "Docifying $f → $out"
  pnpm calm docify -a "$f" -o "$out" --clear-output-directory
done

echo "arch-docify: all CALM files documented. ✓"
