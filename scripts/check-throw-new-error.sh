#!/usr/bin/env bash
set -euo pipefail

# Enforces ADR 0015: direct `throw new Error(` is banned in production code.
# All thrown errors must be instances of a custom class extending AbstractAlistigoError.
#
# Test files are excluded: test assertions/guards are a different pattern from domain errors,
# and BDD step runners expect raw Error objects in their own protocols.

DIRS=()
for d in apps packages agents cli; do
  [[ -d "$d" ]] && DIRS+=("$d")
done

if [[ ${#DIRS[@]} -eq 0 ]]; then
  echo "✓ No source directories found — nothing to check."
  exit 0
fi

found=$(grep -rn "throw new Error(" "${DIRS[@]}" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir="__tests__" \
  --exclude-dir="tests" \
  --exclude-dir="test" \
  --exclude-dir="alistigo-features-runner-playwright" \
  --exclude="*.test.ts" \
  --exclude="*.spec.ts" \
  --exclude="*.test.tsx" \
  --exclude="*.spec.tsx" \
  2>/dev/null || true)

if [[ -n "$found" ]]; then
  echo "$found"
  echo ""
  echo "ERROR: Direct 'throw new Error()' is banned in production code (ADR 0015)."
  echo "Define a custom class that extends AbstractAlistigoError and throw that instead."
  echo "See docs/adrs/0015-custom-error-hierarchy.md"
  exit 1
fi

echo "✓ No direct 'throw new Error()' usages found in production code."
