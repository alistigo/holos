# ADR-004: Artifact Delivery Strategy — npm/jsDelivr over GitHub Pages

**Status:** Accepted
**Date:** 2026-06-02
**Source:** projects/alistigo-ai/research/claude-artifacts-capabilities.md

## Context

Alistigo M1 shipped without a public deployment. The primary use case is embedding a list widget in Claude AI artifacts. Two options were evaluated: GitHub Pages (serve the built SPA at a public URL) vs. npm publishing (load the library via jsDelivr CDN).

## Decision

We publish the `@alistigo/artifact-list` UMD bundle to npm and instruct AI to load it via `https://cdn.jsdelivr.net/npm/@alistigo/artifact-list@latest/dist/index.umd.js`.

GitHub Pages is still deployed but serves only as a testing/demo environment for regular-web iframe embedding.

## Rationale

Live CSP inspection of `www.claudeusercontent.com` (where Claude artifacts run) confirmed:
- `frame-src: 'self' blob:` — external `https://` iframe sources are **blocked**. A `<iframe src="https://mlkiiwy.github.io/...">` inside a Claude artifact silently fails.
- `script-src` and `connect-src` both include `https://cdn.jsdelivr.net/npm/` — any public npm package can be loaded as a `<script>` tag or fetched from artifact JS.

Therefore:
- GitHub Pages URL as iframe src → **blocked by CSP**
- jsDelivr npm bundle as `<script src="...">` → **allowed by CSP**

## Consequences

- We maintain two deployment targets: GitHub Pages (regular-web demos) and npm (Claude artifact use)
- Only `@alistigo/artifact-list` is published to npm; all other packages remain private workspace packages
- AI embedding instructions must use the jsDelivr URL and `<script>` tag pattern, not an `<iframe>` tag
- jsDelivr CDN may take 10–30 minutes to index a newly published npm package

**Note:** jsDelivr versioning strategy (major version pin `@0`) is refined in ADR 0011.
