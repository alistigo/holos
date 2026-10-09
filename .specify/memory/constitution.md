# Holos Constitution

## Core Principles

### I. Package-First Architecture

Every self-contained, independently-versionable unit of the repository MUST be a
workspace package under `packages/`, `apps/`, or `cli/`. This includes non-code artefacts:
CALM architecture models, agent skills, schemas, and document bundles.

**Non-negotiables:**

- Every package MUST have: `package.json` (scoped name `@alistigo/<name>`, semver `version`),
  `project.json` (single source of truth for all Nx targets per CLAUDE.md), `README.md`,
  and `LICENSE`.
- `project.json` is the sole task definition — Nx-orchestratable targets MUST NOT be
  duplicated in `package.json` scripts.
- Cross-package imports MUST use `workspace:*` package names; `../../` relative imports
  that escape a package boundary are forbidden (`no-cross-package-relative-import` arch rule).
- A plain directory at the repo root is acceptable only when it is genuinely one-repo,
  one-consumer, and throwaway. Otherwise it becomes a package.

**Rationale:** A bare directory has no version, is not distributable, carries no dependency
contract, and is invisible to Nx's cache and `affected` analysis. A `package.json` +
`project.json` pair provides all of these for free (ADR-0028).

### II. Platform Architecture: Four-Tier Artifact Platform

Alistigo is a **platform for AI artifacts** — NOT a list app. The list artifact
(`@alistigo/artifact-list`) is the reference implementation.

**Four independently versioned tiers:**

1. **Platform Infra** — CDN-loaded plugins: `artifact-manager`, `artifact-config-format`,
   storage plugins, monitoring plugins.
2. **Artifact Core** — shared by all artifacts: `artifact-core`, `artifact-plugin-api`,
   `logger`.
3. **Artifacts** — one per use-case (list, future kanban, table…); each owns domain
   packages, a config-format leaf, a skill package, and Gherkin features.
4. **Dev Tools** — playground, Gherkin runners, skill tester.

**Non-negotiables:**

- Every `@alistigo` artifact MUST implement the Artifact Contract: lifecycle phases,
  loading screen, error screen, Alistigo badge, plugin hook, config-doc + state-doc,
  and an agent skill package (ADR-0018).
- Platform packages MUST NOT be copy-pasted into new artifacts — depend on them via
  `workspace:*` or npm.
- Artifacts are delivered as UMD bundles via npm + jsDelivr; all jsDelivr URLs MUST
  use the `@0` major-version-pin convention — never version-less (ADR-0011).
- `window.fetch` inside Claude artifact iframes routes ONLY to `api.anthropic.com`;
  it MUST NOT be documented or used as a general HTTP proxy (ADR-0020).

**Rationale:** A monolithic approach forces copy-paste of every loading sequence and
error-boundary across artifacts. Four independently versioned tiers mean a second artifact
depends only on `artifact-core` with zero copy-paste (ADR-0018).

### III. Domain-Driven Design with Event Sourcing + CQRS

Artifact domain logic MUST follow DDD layering. ALL mutations MUST be appended events.

**Non-negotiables:**

- Domain layer has ZERO project-internal imports — no UI, no IO, no DOM, no global state.
- Application layer depends ONLY on Domain + Ports (interfaces it owns); adapters are
  injected — the Application layer MUST NOT import any adapter directly.
- The only way to change state is to append an event to the EventStore; the only way to
  read state is `reduce(EventLog) → Document` (the Projector).
- Documents are derived projections; the event log is the runtime source of truth.
- All Alistigo documents are JSON-LD (`@context`, `@type`, `@id`) using schema.org
  vocabulary by default; `alistigo:` prefixed terms are additive only (ADR-0026).
  Check schema.org first before introducing any new `alistigo:` term.
- All entity IDs MUST use TypeID (`typeid-js`) with a declared prefix per entity type;
  new entity types MUST register a prefix in ADR-0023 before shipping.

**Rationale:** Event sourcing makes every mutation auditable, undo trivial, and sync-friendly.
DDD layering keeps the domain pure so the Gherkin runner and the browser share identical
Application + Domain code against different adapters (ADR-0016, architecture.md C7, C8).

### IV. Test-Driven Development via Gherkin + Storybook

Behavior is **written before code**. Failing tests MUST precede every implementation.

**Non-negotiables:**

- Every behavior MUST be specified in a `.feature` file in a `*-features` package
  BEFORE implementation begins (architecture.md C6).
- A feature is "implemented" only when ALL of the following hold: all scenarios pass via
  the Application-level runner; the same scenarios pass the Playwright bridge; the document
  validates against the JSON Schema; event log replay reproduces the same document.
- Every React component file MUST have a co-located Storybook story:
  `Foo.tsx` → `Foo.stories.tsx` in the same directory. Enforced by `qa:stories-check` in CI
  (ADR-0012).
- No implementation ships without a test; verification-before-completion is mandatory
  before any task is declared done.

**Rationale:** Application-layer step definitions give fast, deterministic feedback without
a browser. Playwright bridge gives UI smoke coverage. Storybook makes every component
visually reviewable in isolation before it ships (ADR-0012, architecture.md §3.6).

### V. Architecture as Code (CALM)

Architecture is the **source of truth**. Code conforms to the model, not the reverse.

**Non-negotiables:**

- All architectural models for Alistigo MUST live in `@alistigo/architecture`
  (`packages/architecture/`) as CALM-compliant JSON (ADR-0027).
- New architectural elements (packages, relationships, boundaries) MUST be declared in
  a CALM `.arch.json` file BEFORE implementation begins. Implement after, never before.
- `qa:arch-check` (dependency-cruiser) enforces code-level layer rules on every PR:
  no circular dependencies; handlers MUST NOT import repositories; services MUST NOT
  import handlers; no cross-package relative imports (docs/arch-check.md).
- CALM file validity is checked via `pnpm nx run architecture:qa:arch-calm` on every PR.

**Rationale:** Static Markdown is not machine-readable, not validatable, and drifts silently.
CALM files are version-controlled, schema-validated, and generate diagrams — making
architecture a first-class CI artefact rather than aspirational commentary (ADR-0027).

## Engineering Standards

**TypeScript**

Strict mode is ON everywhere: `strict`, `exactOptionalPropertyTypes`,
`noUncheckedIndexedAccess`. All packages extend `tsconfig.base.json` at the repo root.
`any` MUST NOT appear without a justification comment on the same line.

**Toolchain**

| Tool | Role |
|------|------|
| **pnpm** | Package manager; internal references via `workspace:*` |
| **Nx** | Build orchestration (`nx run <project>:<target>`, `nx affected`); never bypass |
| **Bun** | TypeScript runtime inside individual packages |
| **Biome** | Linting and formatting; `pnpm biome check --write .` MUST run before every commit |
| **mise** | Tool version manager (`.mise.toml`) |

**UI Stack** (ADR-0001)

- shadcn/ui composable stack: Radix Primitives, Vaul, Motion, Tailwind CSS v4, Radix Colors,
  Lucide.
- i18n: Lingui v6 (`@lingui/macro` + `@lingui/react` + `@lingui/vite-plugin`) — per-locale
  static bundles; switching locale reloads the iframe; no runtime locale switching inside
  the bundle.
- Plain CSS stylesheets and inline `style` props are NOT permitted in any `@alistigo` package.
- Every package with React components MUST install Storybook.

**Data & Identity**

- Entity IDs: TypeID (`typeid-js`) with declared prefix per entity type (ADR-0023). New
  entity types MUST register a prefix before shipping.
- Documents: JSON-LD + schema.org (ADR-0026). Every `*-document` package MUST ship:
  JSON Schema, TypeScript types, examples, README, event projector, and a markdown parser
  where applicable.

**Observability**

- Structured logging: pino via `@alistigo/logger` (`createLogger(module, ctx?)`). Ad-hoc
  `console.log` calls in artifact code are not permitted.
- Error monitoring: Sentry (ADR-0008). MUST degrade gracefully if CSP blocks outbound.
- Analytics: PostHog EU, `memory` persistence (ADR-0010). No consent banner required.

**Release & Distribution**

- Every merge to `main` triggers automated `nx release` — no manual release step (ADR-0013).
- npm: `NPM_TOKEN` (Granular Access Token, scope `@alistigo/*`) stored in GitHub Secrets;
  MUST be rotated before expiry (ADR-0014).
- CDN: jsDelivr `@0` major-version-pin on all `@alistigo/*` URLs — never version-less
  (ADR-0011).

## Development Workflow & Quality Gates

**SDLC Human Review Gates**

Nothing moves to the next stage without explicit human approval.
AI does the work; the human holds the wheel.

| Gate | What the human decides |
|------|------------------------|
| Idea → PRD | Is this worth building? |
| PRD approval | Does the spec capture intent correctly? |
| Epic + Plan approval | Is the decomposition right? Is the approach right? |
| PR merge | Code review and sign-off |
| Communication draft | Reviewed and manually published — no auto-post |

**Git Discipline**

- Branch naming: `feat/`, `fix/`, `chore/`, `docs/`.
- MUST branch before any changes; never commit directly to `main`.
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- No force-push to `main`; force-push anywhere requires explicit user instruction.
- `pnpm biome check --write .` MUST run before every commit; auto-fixed files are staged
  in the same commit.

**Quality Gates**

| Gate | Trigger | Tool |
|------|---------|------|
| `qa:lint` | Pre-push + every PR | Biome |
| `qa:arch-check` | Pre-push + every PR | dependency-cruiser |
| `qa:audit` | Pre-push + every PR | Fallow (changed files only) |
| `qa:dead-code` | Weekly CI | Fallow (full repo) |
| `qa:arch-calm` | Every PR | CALM CLI (`pnpm nx run architecture:qa:arch-calm`) |

ALL `qa:*` gates MUST pass before any merge. No `--no-verify` bypass; fix the underlying
issue.

**Branch Protection** (ADR-0002)

`main` requires a PR; force-push is blocked; required status checks must pass before merge.
The MLKiiwy GitHub App is the sole bypass identity for automated `nx release` commits.

**Agent Skills Standard** (ADR-0015)

Skills live at `.agents/skills/<name>/SKILL.md` (agentskills.io canonical path). Publishable
skills are npm packages under `packages/<name>-skill/`. Trigger quality is verified via
`eval_queries.json` (≥30 queries, train/validation split) before description changes ship.

## Governance

This constitution supersedes all other practices and conventions in case of conflict.
`@alistigo/architecture` (`packages/architecture/`) is the canonical reference for all
system boundaries and relationships.

**Amendment procedure:**

1. Update this file with the change.
2. Increment the version per semver:
   - **MAJOR** — principle removal, redefinition, or backward-incompatible governance change.
   - **MINOR** — new principle, section added, or materially expanded guidance.
   - **PATCH** — clarifications, wording, typo fixes, non-semantic refinements.
3. Update `Last Amended` to today's date (`YYYY-MM-DD`).
4. Commit: `docs: amend constitution to vX.Y.Z (<reason>)`.

All PRs are expected to verify compliance with the active principles. Compliance review is
expected on each amendment. No automated merges to `main` without CI passing.

**Version**: 1.0.0 | **Ratified**: 2026-03-13 | **Last Amended**: 2026-10-09
