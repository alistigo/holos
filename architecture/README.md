# Alistigo Architecture (CALM)

Architecture as Code for the Alistigo platform, using [CALM — Common Architecture Language Model](https://calm.finos.org) (FINOS open standard). See [ADR 0027](../docs/adrs/0027-architecture-as-code-calm.md) for the decision record.

## Principles

- **Architecture is the source of truth**: code conforms to the model, not vice versa
- **New elements are declared here before implementation**
- **CI validates CALM files** on every PR (`pnpm qa:arch-calm`)
- **AI tools (Claude Code, VS Code)** have architecture context via the CALM MCP server

## File Structure

```
architecture/
├── README.md                             ← you are here
├── patterns/                             ← reusable architectural patterns
│   ├── ddd-hexagonal.pattern.json        ← DDD hexagonal layer model
│   └── event-sourcing-cqrs.pattern.json  ← Event sourcing + CQRS
└── systems/                              ← concrete system architectures
    ├── alistigo-platform.arch.json       ← four-tier platform view
    ├── list-artifact-ddd.arch.json       ← list artifact internal DDD architecture
    └── monorepo-toolchain.arch.json      ← dev toolchain and CI
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

## Adding New Architecture Elements

1. Add the node(s) to the relevant `.arch.json` file
2. Add any new relationships
3. Run `pnpm calm validate architecture/` to check the file is valid
4. Open a PR — CI will validate automatically
5. Then implement the code

**Never implement first and update architecture later.** Architecture is the contract.

## Tooling

```sh
# Validate all CALM files
pnpm qa:arch-calm

# Open the interactive CALM server (browse architecture in browser)
pnpm calm-studio

# Generate output from a CALM file
pnpm exec calm generate --input architecture/systems/alistigo-platform.arch.json

# Run the CALM CLI directly
pnpm exec calm --help
```

CALM MCP server support is not yet available as a stable npm package. When `@finos/calm-mcp` is released, wire it into `.mcp.json` (Claude Code) and `.vscode/mcp.json` (VS Code).
