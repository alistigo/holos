# Artifact Contract

Every `@alistigo` artifact must implement all eight items in this contract. The platform
libraries handle most of it — each artifact only needs to wire them together.

The list artifact (`packages/artifact-list/`) is the canonical reference implementation.

---

## 1. Lifecycle Phases

**Provided by:** `@alistigo/artifact-core`

Every artifact progresses through three phases:

```
loading → ready
loading → error
```

- **loading** — artifact is booting: reading config, loading plugins, resolving storage
- **ready** — artifact is fully operational; UI is visible to the user
- **error** — an unrecoverable error occurred; error screen is shown

Call `startArtifact({ plugins, onPhaseChange })` from `mount.ts` to run the standard
startup sequence. The startup sequence is:

1. Emit `loading` phase
2. Load plugins via `@alistigo/artifact-plugin-api`'s `loadPlugins()`
3. Resolve active storage plugin
4. Emit `ready` phase (or `error` if any step fails critically)

---

## 2. Loading Screen

**Provided by:** `@alistigo/artifact-core-components-react`

Shown during the `loading` phase. Shows the Alistigo logo, a spinner, and optionally
the artifact name.

```tsx
import { LoadingScreen } from "@alistigo/artifact-core-components-react";

// In the loading phase handler:
<LoadingScreen artifactName="@alistigo/artifact-list" />
```

---

## 3. Error Screen

**Provided by:** `@alistigo/artifact-core-components-react`

Shown when the lifecycle reaches the `error` phase (uncaught render error or critical
boot failure). Shows the error message and an optional reset button.

```tsx
import { ErrorScreen } from "@alistigo/artifact-core-components-react";

<ErrorScreen error={err} onReset={() => window.location.reload()} />
```

The `ArtifactErrorBoundary` from `@alistigo/artifact-core` catches render errors
and transitions the phase automatically.

---

## 4. Alistigo Badge

**Provided by:** `@alistigo/artifact-core-components-react`

A small persistent button in the **top-right corner** of every loaded artifact. Collapsed
by default (shows only the Alistigo logo). Clicking it opens the `ArtifactInfoModal`.

```tsx
import { AlistigoBadge } from "@alistigo/artifact-core-components-react";

// In the ready-phase renderer, wrapping the artifact UI:
<div style={{ position: "relative", height: "100%", width: "100%" }}>
  <ArtifactUI />
  <AlistigoBadge
    artifactName={ARTIFACT_NAME}
    artifactVersion={ARTIFACT_VERSION}
    plugins={ctx.plugins}  // LoadedPlugin[] from startArtifact()
  />
</div>
```

`ARTIFACT_NAME` and `ARTIFACT_VERSION` are injected at build time via Vite `define`
from the artifact's `package.json`.

The `ArtifactInfoModal` (opened by the badge) shows:
- Artifact name + version
- List of plugins: name, version, type chip, status indicator (loaded / error / not-loaded)

---

## 5. Plugin Hook

**Provided by:** `@alistigo/artifact-plugin-api` (via `artifact-core`)

Every artifact integrates with the plugin system. Plugins are CDN-loaded ESM bundles
declared in the config document's `plugins` field. They hook into lifecycle events
(setup, beforeMount, mounted) and react to the event bus.

The `startArtifact()` function handles plugin loading automatically. Each artifact
passes its `buildPluginSpec(config)` output:

```ts
import { startArtifact } from "@alistigo/artifact-core";
import { buildPluginSpec } from "./plugins";  // artifact-specific

const ctx = await startArtifact({
  plugins: buildPluginSpec(config),
  onPhaseChange: (phase, ctx) => { ... },
});
```

See [ADR 0016](../adrs/0016-artifact-plugin-system.md) for the full plugin interface.

---

## 6. AI Async API

**Provided by:** `@alistigo/ai-chat-async-api`

Each artifact:
1. Publishes an `api.json` file describing its operations (AsyncAPI 3.0 subset)
2. Registers action handlers via `ApiCallsExecutor`

The executor runs on boot (after `ready` phase), reads any `<api-calls>` tag in the
DOM, executes the calls, and removes the tag.

```ts
import { ApiCallsExecutor, defineApiAction } from "@alistigo/ai-chat-async-api";
import apiDefinition from "../api.json";

const executor = new ApiCallsExecutor(apiDefinition, {
  addElement: defineApiAction("addElement", async ({ text }) => {
    await applicationService.addElement(text);
  }),
  renameList: defineApiAction("renameList", async ({ name }) => {
    await applicationService.renameList(name);
  }),
  // ...
});
executor.run();
```

---

## 7. Config-Doc + State-Doc Contract

**Provided by:** `@alistigo/artifact-config-format` (config); artifact-specific format package (state)

Every artifact operates on exactly two documents:

| Document | Purpose | Author |
|----------|---------|--------|
| Config document | How the artifact behaves | Host (Claude, playground) |
| State document | What the artifact contains | Artifact + user actions |

Config fields common to all artifacts: `app` (required), `lang` (optional). Artifact-
specific fields are in the artifact's leaf config-format package.

See `docs/architecture.md §12` for the full spec.

---

## 8. Agent Skill

**Per-artifact skill package** (e.g. `packages/artifact-list-skill/`)

Each artifact ships a skill that teaches the AI chat agent:
1. What the artifact is
2. When to use it (trigger phrases)
3. How to write its config document
4. How to use its AI API (actions + example `<api-calls>` tag)

See [skill-pattern.md](skill-pattern.md) for the full pattern.
