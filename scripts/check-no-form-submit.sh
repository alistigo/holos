#!/usr/bin/env bash
# Guards artifact packages against native HTML form submission, which is blocked
# by the Claude sandbox (no allow-forms). Use onClick/onKeyDown handlers instead.
# See: docs/research/claude-artifacts-capabilities.md

set -euo pipefail

FOUND=()

while IFS= read -r match; do
  FOUND+=("$match")
done < <(grep -rn '<form' packages --include="*.tsx" --exclude="*.stories.tsx" --exclude="*.test.tsx" 2>/dev/null || true)

while IFS= read -r match; do
  FOUND+=("$match")
done < <(grep -rn "type=['\"]submit['\"]" packages --include="*.tsx" --exclude="*.stories.tsx" --exclude="*.test.tsx" 2>/dev/null || true)

if (( ${#FOUND[@]} > 0 )); then
  echo "ERROR: Artifact packages must not use native form submission (blocked by Claude sandbox)."
  echo "Use onClick/onKeyDown handlers instead of <form onSubmit> and type=\"submit\"."
  echo "See: docs/research/claude-artifacts-capabilities.md"
  echo ""
  printf "  %s\n" "${FOUND[@]}"
  exit 1
fi

echo "artifact-sandbox-check: no forbidden form submission patterns found. ✓"
