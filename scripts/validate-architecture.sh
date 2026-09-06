#!/usr/bin/env bash
# Validates every CALM architecture/pattern file under architecture/.
#
# The installed @finos/calm-cli (ADR 0027) does not accept a bare directory
# argument to `calm validate` — each file must be passed explicitly via -a.
# The two files under architecture/patterns/ are concrete node/relationship
# documents (not parametrised JSON-Schema patterns), so they validate as
# architectures too.

set -euo pipefail

shopt -s nullglob
files=(architecture/systems/*.arch.json architecture/patterns/*.pattern.json)

if (( ${#files[@]} == 0 )); then
  echo "ERROR: no CALM architecture files found under architecture/"
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
