---
name: playground-tabbed-panels
status: in-progress
created: 2026-07-24T00:00:00Z
updated: 2026-07-24T00:00:00Z
progress: 100%
branch: feat/playground-tabbed-panels
---

# Epic: playground-tabbed-panels — Playground Panel Refactor (Tabbed Left + Right Panels)

## Overview

Refactor the `alistigo-artifact-playground` host UI into two fully-tabbed panels:

**Left panel (HostForm → tabbed):**
- **Config tab**: three visually distinct groups ("Playground config" / "Global artifact config" / "Artifact config"), each containing extracted sub-components
- **Storage tab**: live explorer for the Claude storage simulator — key list on the left, JSON tree viewer on the right
- **API tab**: placeholder (empty, future use)

**Right panel (ArtifactViewPanel → extended):**
- Existing App + Source tabs kept as-is
- New **Config tab**: JSON tree view of the artifact config object injected into the iframe
- New **Document tab**: JSON tree view of the active document JSON

## New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ConfigFormArtifact` | `src/components/` | Language + Read-only fields (global artifact config) |
| `ConfigFormListArtifact` | `src/components/` | Plugin list + Document selection (list-artifact-specific) |
| `StorageExplorer` | `src/components/` | Split-pane storage key list + JSON value viewer |

Each component has a Storybook story file alongside it.

## Key Changes

- `HostForm.tsx`: full refactor to tabbed layout with Config/Storage/API tabs; groups made visually distinct; Reload+Clear moved below AI context in Playground config group
- `ArtifactViewPanel.tsx`: add Config + Document tabs; accept `configJson` and `docJson` props
- `useClaudeStorageSimulator.ts`: expose reactive `storeEntries: [string, string][]`
- `buildIframeSrcdoc.ts`: extract `buildArtifactConfig(config)` helper for reuse in HostPage
- `HostPage.tsx`: wire up all new props and pass `configJson`, `docJson`, `storeEntries`

## Dependencies

- `react-json-view-lite@^2.5.0` — JSON tree viewer (added as dependency)

## Tasks

- [x] Task 001: Create branch `feat/playground-tabbed-panels`
- [x] Task 002: Install `react-json-view-lite` dependency
- [x] Task 003: Extract `buildArtifactConfig` helper from `buildIframeSrcdoc.ts`
- [x] Task 004: Make `useClaudeStorageSimulator` expose reactive `storeEntries`
- [x] Task 005: Create `ConfigFormArtifact` component + story
- [x] Task 006: Create `ConfigFormListArtifact` component + story
- [x] Task 007: Create `StorageExplorer` component + story
- [x] Task 008: Refactor `HostForm` into tabbed panel (Config/Storage/API)
- [x] Task 009: Update `HostForm.stories.tsx`
- [x] Task 010: Add Config + Document tabs to `ArtifactViewPanel`
- [x] Task 011: Update `ArtifactViewPanel.stories.tsx`
- [x] Task 012: Wire up all props in `HostPage`
- [x] Task 013: Run typecheck and fix any errors
