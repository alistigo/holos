# ADR-006: GitHub Pages Scope — Testing/Demos Only

**Status:** Accepted
**Date:** 2026-06-02
**Source:** projects/alistigo-ai/research/claude-artifacts-capabilities.md

## Context

After researching Claude artifact CSP constraints (ADR-004), GitHub Pages cannot serve as the primary AI artifact delivery mechanism. We still deploy to GitHub Pages for other reasons.

## Decision

GitHub Pages deployment at `https://mlkiiwy.github.io/europa/alistigo/{version}/{locale}/` serves the iframe-embeddable SPA for:
- Developer testing of the widget in a real browser
- Demo links in documentation and presentations
- Regular-web embedding (HTML pages outside Claude)

It is explicitly **not** the delivery mechanism for Claude artifact embedding.

## Rationale

Despite not being usable in Claude artifacts, GitHub Pages is still worth deploying because:
1. Regular websites (outside Claude) can embed the widget via `<iframe>` — `localStorage` works there
2. Developers need a live URL to test and demonstrate the widget
3. Each app version stays accessible at its versioned URL (`alistigo/v0.1.0/en/`)
4. The `llms.txt` and `mcp-tool.json` are served from these URLs for non-Claude AI tooling

## Consequences

- `keep_files: true` in the deploy action preserves all previously deployed version directories
- The GitHub Pages deploy triggers on changes to alistigo-related paths on main
- llms.txt at the GitHub Pages URL must clearly state that iframe embedding is for regular-web only; Claude artifacts should use the npm/jsDelivr approach
