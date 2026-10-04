#!/usr/bin/env bash
# Generates interactive archify HTML diagrams from every architecture file.
# Runs from packages/architecture/ (the arch-archify Nx target sets cwd).
#
# Pipeline per file:
#   1. calm-to-archify <input> --output .archify-out/<id>.archify.json
#   2. archify-render .archify-out/<id>.archify.json
#   3. cp .archify-out/<id>.archify.html to websites/alistigo/public/archify/
#
# Note: only .arch.json files are processed — .pattern.json are JSON Schema docs.

set -euo pipefail

OUTPUT_ROOT=".archify-out"
WEBSITE_PUBLIC="../../websites/alistigo/public/archify"

shopt -s nullglob
arch_files=(systems/*.arch.json)
extra_arch_files=(../../packages/list-domain/artifact-list.arch.json)
all_files=("${arch_files[@]}" "${extra_arch_files[@]}")

if (( ${#all_files[@]} == 0 )); then
  echo "ERROR: no CALM architecture files found"
  exit 1
fi

mkdir -p "$OUTPUT_ROOT" "$WEBSITE_PUBLIC"

for f in "${all_files[@]}"; do
  id=$(node -e "process.stdout.write(require('./$f')['unique-id'])")
  archify_json="$OUTPUT_ROOT/$id.archify.json"
  archify_html="$OUTPUT_ROOT/$id.archify.html"

  echo "Transforming $f → $archify_json"
  pnpm calm-to-archify "$f" --output "$archify_json"

  echo "Rendering $archify_json → $archify_html"
  pnpm archify-render "$archify_json"

  cp "$archify_html" "$WEBSITE_PUBLIC/$id.archify.html"
  echo "Copied → $WEBSITE_PUBLIC/$id.archify.html"
done

echo "arch-archify: all files rendered. ✓"
