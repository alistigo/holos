---
title: Layer Diagram
description: Package dependency graph and layer boundaries of the Alistigo platform.
---

The Alistigo platform has strict layer boundaries enforced by `dependency-cruiser` in CI.
No cross-layer imports are permitted. Violations block merge.

## Package Layers (top to bottom)

```plaintext
Applications
  └── alistigo-artifact-playground          (dev harness, Vite + React)

Artifacts (tier 3 — reference implementation)
  ├── artifact-list                         (UMD bundle → jsDelivr)
  │   ├── list-domain                       (pure domain, no framework deps)
  │   ├── list-document-format              (JSON-LD schema + TypeScript types)
  │   ├── list-document-editor              (command handlers, projector)
  │   ├── list-components-react             (UI components)
  │   └── list-document                     (projection + event log)
  ├── list-features                         (Gherkin .feature specs)
  └── artifact-list-skill                   (agent skill definition)

Artifact Core (tier 2 — shared)
  ├── artifact-core                         (lifecycle, startArtifact())
  ├── artifact-core-components-react        (LoadingScreen, ErrorScreen)
  ├── artifact-plugin-api                   (plugin interface + event bus)
  ├── ai-chat-async-api                     (<api-calls> executor)
  └── logger                                (pino-based structured logging)

Platform Infrastructure (tier 1 — CDN-loaded)
  ├── artifact-manager                      (CDN resolver + script injector)
  ├── artifact-config-format                (discriminated union config schema)
  ├── artifact-sentry-plugin                (error monitoring plugin)
  ├── artifact-posthog-plugin               (analytics plugin)
  ├── claude-storage-plugin                 (Claude artifact storage backend)
  └── local-storage-plugin                  (localStorage backend)

Architecture
  └── @alistigo/architecture (private)      (CALM models, ADRs, prose docs)

CLIs
  ├── list-features-runner-playwright       (Gherkin E2E runner)
  ├── document-validator                    (JSON Schema validator)
  └── agent-skill-tester                    (skill accuracy evaluation)
```

## Allowed Import Directions

```
Applications → Artifacts → Artifact Core → Platform Infrastructure
                         ↘ Architecture (private, never published)
CLIs → any layer (build-time tools only)
```

Packages at the same layer may not import each other unless explicitly allowed
in `.dependency-cruiser.cjs`. All violations are reported as errors in CI.
