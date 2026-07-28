# Platform Layer Diagram

Full layer diagram with all package names as of P0 (2026-07-27).

---

## Layer Model

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  DEV TOOLS  (for artifact developers; published to npm + deployed as demos)  │
│                                                                              │
│  apps/alistigo-artifact-playground   — dev harness with Claude-like iframe  │
│  cli/agent-skill-tester              — skill trigger accuracy evaluation     │
│  cli/list-features-runner-playwright — Gherkin runner for list artifact      │
│  packages/list-features              — Gherkin .feature specs (list)         │
└──────────────────────────────────────────┬───────────────────────────────────┘
                                           │
┌──────────────────────────────────────────▼───────────────────────────────────┐
│  ARTIFACTS  (shipped via npm + jsDelivr; run inside Claude/host iframes)     │
│                                                                              │
│  packages/artifact-list              @alistigo/artifact-list                │
│  packages/artifact-config-list-format @alistigo/artifact-config-list-format │
│  packages/list-domain                @alistigo/list-domain                  │
│  packages/list-document-format       @alistigo/list-document-format         │
│  packages/list-document-editor       @alistigo/list-document-editor         │
│  packages/list-components-react      @alistigo/list-components-react        │
│  packages/artifact-list-skill        @alistigo/artifact-list-skill          │
│                                                                              │
│  (future artifacts follow the same pattern with their own packages)          │
└──────────────────────────────────────────┬───────────────────────────────────┘
                                           │ uses
┌──────────────────────────────────────────▼───────────────────────────────────┐
│  ARTIFACT CORE  (shared by all artifacts; bundled into each artifact)         │
│                                                                              │
│  packages/artifact-core              @alistigo/artifact-core                │
│    └─ lifecycle phases, startArtifact(), ArtifactErrorBoundary, AuthPlugin  │
│                                                                              │
│  packages/artifact-core-components-react                                    │
│    └─ @alistigo/artifact-core-components-react                              │
│       LoadingScreen, ErrorScreen, AlistigoBadge, ArtifactInfoModal          │
│                                                                              │
│  packages/artifact-plugin-api        @alistigo/artifact-plugin-api          │
│    └─ AlistigoPlugin interface, PluginContext, event bus, loadPlugin()       │
│                                                                              │
│  packages/ai-chat-async-api          @alistigo/ai-chat-async-api  (optional) │
│    └─ ApiCallsExecutor, ArtifactApiDefinition, <api-calls> tag executor     │
│                                                                              │
│  packages/logger                     @alistigo/logger                       │
│    └─ pino-based structured logging, createLogger(), setLogLevel()          │
└──────────────────────────────────────────┬───────────────────────────────────┘
                                           │
┌──────────────────────────────────────────▼───────────────────────────────────┐
│  PLATFORM INFRA  (CDN-loaded at runtime; independently versioned)            │
│                                                                              │
│  packages/artifact-manager           @alistigo/artifact-manager             │
│    └─ resolves artifact names → CDN UMD URL, injects <script>               │
│                                                                              │
│  packages/artifact-config-format     @alistigo/artifact-config-format       │
│    └─ discriminated union of all artifact config schemas                    │
│                                                                              │
│  packages/artifact-sentry-plugin     @alistigo/artifact-sentry-plugin       │
│    └─ Sentry error monitoring (infra plugin, ESM bundle)                    │
│                                                                              │
│  packages/artifact-posthog-plugin    @alistigo/artifact-posthog-plugin      │
│    └─ PostHog analytics (infra plugin, ESM bundle)                          │
│                                                                              │
│  packages/claude-storage-plugin      @alistigo/claude-storage-plugin        │
│    └─ window.storage backend (storage plugin, ESM bundle)                   │
│                                                                              │
│  packages/local-storage-plugin       @alistigo/local-storage-plugin         │
│    └─ localStorage backend (storage plugin, ESM bundle)                     │
│                                                                              │
│  (future: auth plugin, other infra plugins)                                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Dependency Rules

1. **Domain layer has zero project-internal imports.** (`list-domain`, `list-document-format`)
2. **Application layer imports only Domain + Ports.** (`list-document-editor`)
3. **Artifact Core has zero list-specific imports.** (`artifact-core`, `artifact-core-components-react`, `ai-chat-async-api`)
4. **Artifacts depend on Artifact Core, not on each other.**
5. **Platform Infra packages are loaded at CDN runtime, not bundled into artifacts.**
6. **Dev Tools are never imported by shipped packages.**

These rules are enforced by `dependency-cruiser` (see `docs/arch-check.md`).

---

## CLI Tools

| CLI directory | npm name | Purpose |
|---|---|---|
| `cli/document-validator` | `@alistigo/document-validator` | Validate any artifact document against a JSON Schema |
| `cli/list-features-runner-playwright` | `@alistigo/list-features-runner-playwright` | Gherkin runner for list features |
| `cli/agent-skill-tester` | `@alistigo/agent-skill-tester` | Skill trigger accuracy evaluation |

---

## How to Add a New Artifact

1. Create `packages/artifact-<name>/` — the UMD bundle
2. Create `packages/artifact-config-<name>-format/` — leaf config schema
3. Create `packages/<name>-domain/` — domain model (entities, events, commands)
4. Create `packages/<name>-document-format/` — document JSON Schema + types
5. Create `packages/<name>-document-editor/` — command handlers + projector
6. Create `packages/<name>-components-react/` — UI components with Storybook
7. Create `packages/artifact-<name>-skill/` — agent skill (SKILL.md + api.json)
8. Create `packages/<name>-features/` — Gherkin specs
9. Create `cli/<name>-features-runner-playwright/` — Gherkin runner
10. Add the new config leaf to `@alistigo/artifact-config-format`'s discriminated union
11. Depend on `@alistigo/artifact-core` + `@alistigo/artifact-core-components-react` — do NOT copy from `artifact-list`
