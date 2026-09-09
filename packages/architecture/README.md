# @alistigo/architecture

Architecture as Code for the Alistigo platform, using [CALM — Common Architecture Language Model](https://calm.finos.org) (FINOS open standard). See [ADR 0027](../../docs/adrs/0027-architecture-as-code-calm.md) for the decision record, and [ADR 0028](../../docs/adrs/0028-package-first-repository-structure.md) for why this is a versioned package rather than a repo-root directory.

## Principles

- **Architecture is the source of truth**: code conforms to the model, not vice versa
- **New elements are declared here before implementation**
- **CI validates CALM files** on every PR (`pnpm nx run architecture:qa:arch-calm`)
- **AI tools (Claude Code, VS Code)** have architecture context via the CALM MCP server

## Consuming this package

The models are shipped as plain JSON. Another workspace package can depend on it
via `"@alistigo/architecture": "workspace:*"` and import a model:

```ts
import platform from "@alistigo/architecture/systems/alistigo-platform.arch.json" with { type: "json" };
```

## File Structure

```
packages/architecture/
├── README.md                                ← you are here
├── scripts/validate.sh                      ← CALM validation gate (qa:arch-calm)
├── patterns/                                ← reusable architectural patterns
│   ├── ddd-hexagonal.pattern.json           ← DDD hexagonal layer model
│   └── event-sourcing-cqrs.pattern.json     ← Event sourcing + CQRS
└── systems/                                 ← concrete system architectures
    ├── alistigo-platform.arch.json          ← four-tier platform view
    ├── list-artifact-ddd.arch.json          ← list artifact internal DDD architecture
    ├── monorepo-toolchain.arch.json         ← dev toolchain and CI
    ├── monorepo-packages.arch.json          ← every app/package/CLI as a node, wired by workspace:* deps
    └── ai-chat-web-artifact.arch.json       ← generic artifact-capable AI chat environment (iframe sandbox + message bus)
```

## Architecture Views

### 1. Platform — Four Tiers

```
alistigo-platform.arch.json
```

The Alistigo platform organises code into four independently-versioned tiers:

```mermaid
graph TB
  subgraph DT["Dev Tools Tier"]
    playground[alistigo-artifact-playground]
    runner[list-features-runner-playwright]
    skilltest[agent-skill-tester]
  end

  subgraph AT["Artifacts Tier"]
    artifactlist["@alistigo/artifact-list (UMD bundle)"]
    listdomain["@alistigo/list-domain"]
    listformat["@alistigo/list-document-format"]
    listeditor["@alistigo/list-document-editor"]
    listui["@alistigo/list-components-react"]
  end

  subgraph AC["Artifact Core Tier"]
    core["@alistigo/artifact-core"]
    pluginapi["@alistigo/artifact-plugin-api"]
    aichat["@alistigo/ai-chat-async-api"]
    logger["@alistigo/logger"]
  end

  subgraph PI["Platform Infra Tier (CDN-loaded)"]
    manager["@alistigo/artifact-manager"]
    configfmt["@alistigo/artifact-config-format"]
    sentry["@alistigo/artifact-sentry-plugin"]
    posthog["@alistigo/artifact-posthog-plugin"]
    clstorage["@alistigo/claude-storage-plugin"]
    lsstorage["@alistigo/local-storage-plugin"]
  end

  User -->|interacts| AT
  Claude -->|embeds + postMessage| AT
  DT --> AT
  AT --> AC
  AT --> PI
  PI --> jsDelivr[(jsDelivr CDN)]
  PI --> Sentry
  PI --> PostHog
```

### 2. List Artifact — DDD Internals

```
list-artifact-ddd.arch.json  (uses patterns: ddd-hexagonal, event-sourcing-cqrs)
```

```mermaid
graph TB
  subgraph Presentation
    ui[list-components-react]
  end

  subgraph Application["Application (list-document-editor)"]
    handlers[Command Handlers]
    projector[Projector — reduce events → Document]
    queries[Queries]
    ports[Ports / Interfaces]
  end

  subgraph Domain["Domain (list-domain)"]
    entities[Entities: List, ListItem]
    events[Domain Events]
    commands[Command Types]
  end

  subgraph Adapters
    ls[LocalStorageEventStore]
    cs[ClaudeStorageEventStore]
    mem[InMemoryEventStore]
    ser[JsonLdSerializer]
    val[AjvValidator]
    bridge[PostMessageHostBridge M5+]
  end

  ui --> handlers
  ui --> queries
  handlers --> Domain
  projector --> Domain
  Adapters --> ports
  ls --> storage[(localStorage)]
  cs --> storage
```

### 3. Monorepo Toolchain

```
monorepo-toolchain.arch.json
```

```mermaid
graph LR
  dev[Developer / Claude Code]
  dev --> pnpm
  pnpm --> nx[Nx]
  nx --> Bun
  nx --> Biome
  nx --> tsc[TypeScript]
  nx --> depcruiser[dependency-cruiser]
  nx --> Fallow
  nx --> Vitest
  nx --> Playwright
  nx --> CALM[CALM Toolchain]
  CI[GitHub Actions] --> nx
  CI --> CALM
```

### 4. Package Dependency Graph

```
monorepo-packages.arch.json
```

Every app, package, and CLI tool in the workspace as a node (31 total: 1 app, 25 packages, 3 CLI tools, 2 actors), wired by their actual `workspace:*` dependencies from each `package.json`. This is the ground-truth, code-derived counterpart to the conceptual four-tier view above — useful as a fitness-function baseline once CALM-declared boundaries are compared against `dependency-cruiser` output (ADR 0027 §5).

### 5. Artifact-Capable AI Chat Environment

```
ai-chat-web-artifact.arch.json
```

A **generic** reference architecture for any AI chat product that lets users
create, edit and share *artifacts* — small web apps that run inside the chat. No
vendor specifics: a given AI web chat is one implementation of this shape. The
`ai-user` only ever touches the chat UI and the UI an artifact renders. The
`artifact` is encapsulated inside a network-isolated iframe whose *only* boundary
to the outside is a `postMessage` message bus, modelled as the paired bus
interfaces on `ai-chat-web-app` and `artifact` (there is no standalone bus node).
`ai-artifact-environment` splits into an `ai-artifact-backend`
(`ai-api`, `ai-key-value-storage`, `ai-artifact-source-code-server`) and an
`ai-artifact-frontend-application` (`ai-chat-web-app`, the sandboxed iframe, and
the `ai-cdn-source-allowlist`).

```mermaid
graph TB
  aiuser([ai-user])

  subgraph AIENV["ai-artifact-environment"]
    subgraph BE["ai-artifact-backend — private, protected"]
      api[ai-api]
      keystore[(ai-key-value-storage)]
      srcserver[ai-artifact-source-code-server]
    end

    subgraph FE["ai-artifact-frontend-application"]
      chat[ai-chat-web-app — web/desktop app]
      cdn[(ai-cdn-source-allowlist)]

      subgraph IFRAME["artifact-view-sandboxed-iframe — no network in/out"]
        artifact[artifact — web-app from a CDN]
      end
    end
  end

  aiuser -->|chats| chat
  aiuser -->|interacts with UI of| artifact
  chat -->|HTTPS| api
  chat <-->|"two-way postMessage bus"| artifact
  chat -->|"brokers AI calls (creds host-side)"| api
  chat -->|"brokers get/set/delete/list"| keystore
  srcserver -->|"HTTPS: artifact document"| artifact
  artifact -->|"bundle + libs, HTTPS"| cdn
  IFRAME -.->|"CSP script-src limited to"| cdn
```

## Adding New Architecture Elements

1. Add the node(s) to the relevant `.arch.json` file
2. Add any new relationships
3. Run `pnpm nx run architecture:qa:arch-calm` to validate every CALM file (the installed `calm validate` doesn't accept a bare directory, so this delegates to `scripts/validate.sh`)
4. Open a PR — CI will validate automatically
5. Then implement the code

**Never implement first and update architecture later.** Architecture is the contract.

## Tooling

```sh
# Validate all CALM files (from repo root)
pnpm nx run architecture:qa:arch-calm

# Open the interactive CALM server (browse architecture in browser)
pnpm calm-studio

# Generate a scaffold architecture from a pattern
pnpm calm generate -p packages/architecture/patterns/ddd-hexagonal.pattern.json -o packages/architecture/systems/new-system.arch.json

# Validate a single file directly
pnpm calm validate -a packages/architecture/systems/alistigo-platform.arch.json -f pretty

# Run the CALM CLI directly
pnpm calm --help
```

CALM MCP server support is not yet available as a stable npm package. When `@finos/calm-mcp` is released, wire it into `.mcp.json` (Claude Code) and `.vscode/mcp.json` (VS Code).
