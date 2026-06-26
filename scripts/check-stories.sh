#!/usr/bin/env bash
# Asserts every component in apps/ and packages/ has a co-located .stories.tsx.
#
# Component detection conventions (ADR 0012):
#   Pattern A (apps): src/components/*.tsx
#   Pattern B (packages): src/<Name>/<Name>.tsx  (directory name == file name)
#
# Excluded: *.stories.tsx, *.test.tsx

set -euo pipefail

MISSING=()

# Pattern A: apps — src/components/<Name>.tsx
while IFS= read -r file; do
  story="${file%.tsx}.stories.tsx"
  [[ -f "$story" ]] || MISSING+=("$file")
done < <(find apps -path "*/src/components/*.tsx" ! -name "*.stories.tsx" ! -name "*.test.tsx" 2>/dev/null)

# Pattern B: packages — src/<Name>/<Name>.tsx (directory name == file name)
while IFS= read -r file; do
  base=$(basename "$file" .tsx)
  parent=$(basename "$(dirname "$file")")
  if [[ "$base" == "$parent" ]]; then
    story="${file%.tsx}.stories.tsx"
    [[ -f "$story" ]] || MISSING+=("$file")
  fi
done < <(find packages -name "*.tsx" ! -name "*.stories.tsx" ! -name "*.test.tsx" 2>/dev/null)

if (( ${#MISSING[@]} > 0 )); then
  echo "ERROR: Components missing Storybook stories (ADR 0012):"
  printf "  %s\n" "${MISSING[@]}"
  exit 1
fi

echo "stories-check: all components have stories. ✓"
