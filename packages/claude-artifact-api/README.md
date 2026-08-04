# @alistigo/claude-artifact-api

TypeScript types and inject script for the Claude artifact iframe API.

**We do not control this API.** Claude injects an opaque bridge script into every artifact iframe. This package snapshots that script and documents the runtime API shapes derived from actual Claude sessions. When Claude updates the script or the API, we update this package.

## What this package provides

- **`inject-script.html`** — the raw `<script>` tag Claude injects into artifact iframes, captured verbatim. Importable via Vite's `?raw` suffix.
- **TypeScript interfaces** — accurate shapes of every `window.storage` method result, reverse-engineered from real Claude responses.
- **Global Window augmentation** — `window.storage` and `window.claude` are typed automatically once this package is imported.

## Usage

```ts
import type { ClaudeStorageGetResult } from "@alistigo/claude-artifact-api";

// window.storage is typed automatically via the package's declare global
const result = await window.storage!.get("my-key");
result["@type"]; // string
result.value;    // JSON string
```

```ts
// Vite: import the inject script as a raw string
import claudeBridgeHtml from "@alistigo/claude-artifact-api/inject-script.html?raw";
```

## Version history

| version | date       | Claude version note |
|---------|------------|---------------------|
| 0.1.0   | 2026-08-04 | Initial extraction. Observed all 4 storage methods + `window.claude.complete`. All results include `key`, `shared`, `"@type"`. `get` and `delete` reject (never resolve) when key not found. |

## How to update

When Claude changes the inject script or API:

1. Open Claude artifact devtools → copy the `<script>` block → paste into `inject-script.html`
2. Run the playground with `aiContext: "claude"` and observe actual result shapes in the simulator
3. Update interfaces in `src/index.ts` to match observed shapes
4. Bump the package version
5. Add a row to the version history table above with the date and what changed
