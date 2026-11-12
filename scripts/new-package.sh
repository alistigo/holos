#!/usr/bin/env bash
# Redirects to the canonical location in artifact-dev-tools.
exec "$(dirname "${BASH_SOURCE[0]}")/../packages/artifact-dev-tools/scripts/new-package.sh" "$@"
