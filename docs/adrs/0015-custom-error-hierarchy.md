---
status: accepted
date: 2026-06-29
deciders: Mikael Labrut
---

# ADR 0015 — Custom Error Hierarchy

**Status:** Accepted  
**Date:** 2026-06-29

## Context

The codebase raises errors through raw `throw new Error("...")` statements. This pattern has three
problems:

1. **No domain identity.** `instanceof Error` is true for every error in the runtime. A catch block
   cannot tell a list validation failure from an unexpected null-dereference — both arrive as a
   plain `Error`.
2. **No structured context.** The only information available is a free-text message string. Sentry
   (ADR 0008) can record the message but cannot index or filter on structured fields such as
   `listId`, `userId`, or `fieldName`.
3. **No enforceability.** There is no machine-checkable rule that prevents a contributor from
   scattering new raw throws across the codebase.

Requirements:

| ID | Requirement | Priority |
|----|-------------|----------|
| R1 | Every thrown value is a custom subclass of `Error` | P1 |
| R2 | All errors carry a typed, safe debug-context property | P1 |
| R3 | The hierarchy reflects domain boundaries (list, future: plugin, user, …) | P1 |
| R4 | `instanceof` narrowing works reliably across transpilation targets | P1 |
| R5 | The rule is enforced by static analysis in `pnpm qa` | P1 |
| R6 | Context fields never carry passwords, tokens, secrets, or raw PII | P1 |

ADR 0008 already captures errors in Sentry. Named error classes will produce richer Sentry events
with the class name as the error type and structured context as extra data.

## Decision

**Never use `throw new Error(...)` directly.** Always throw a named custom subclass.

### Error hierarchy

```
Error
  └── AbstractAlistigoError        ← alistigo-wide root; adds ErrorContext
        └── AbstractListError       ← all list-domain errors
              └── InvalidListIdError       (leaf — concrete, throwable)
              └── ListElementNotFoundError (leaf)
              └── …
```

- **Abstract classes** are declared `abstract` and cannot be thrown directly.
- **Leaf classes** are concrete and carry only the fields needed for their specific failure.
- When a new domain package is added, add an abstract intermediate that extends
  `AbstractAlistigoError` (e.g., `AbstractPluginError`).

### ErrorContext type

```typescript
export type ErrorContext = Record<string, string | number | boolean | null | undefined>;
```

Restricting values to primitives prevents accidentally serializing nested objects that carry
secrets or PII.

**Safe context fields:** `userId`, `listId`, `elementId`, `fieldName`, `valueLength`,
`operationName`, `schemaVersion`, timestamps, version strings, opaque UUIDs.

**Never include:** `password`, `token`, `apiKey`, `sessionSecret`, `email`, `phone`, raw
user-submitted content, or any field from a user-profile model.

### Abstract base implementation

```typescript
export abstract class AbstractAlistigoError extends Error {
  readonly context: ErrorContext;

  constructor(message: string, context: ErrorContext = {}) {
    super(message);
    this.name = this.constructor.name;
    this.context = context;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
```

`Object.setPrototypeOf(this, new.target.prototype)` restores the prototype chain broken by
TypeScript's ES5 downcompilation of `class … extends Error`, ensuring `instanceof` works
correctly at runtime.

`this.name = this.constructor.name` makes Sentry display the leaf class name ("InvalidListIdError")
instead of the generic "Error".

### Leaf error rules

- The **human-readable message** is defined inside the class constructor — never passed in by the
  caller. This keeps error strings under version control and prevents callers from composing
  arbitrary messages.
- **Sensitive data** from the call site goes into the `context` object, not the message string.
- Each leaf class lives in the `errors/` directory of the package that owns the domain.

### Directory layout

```
packages/alistigo-domain/src/errors/
  abstract-alistigo-error.ts   ← AbstractAlistigoError + ErrorContext type
  list-error.ts                ← AbstractListError + all list-domain leaf errors
  index.ts                     ← re-exports
```

### Enforcement

Three complementary gates run in `pnpm qa`:

1. **Biome `useThrowOnlyError`** — rejects throwing non-`Error` values (strings, plain objects,
   `undefined`).
2. **Biome `useThrowNewError`** — requires the `new` keyword when throwing (catches
   `throw Error()` without `new`).
3. **`scripts/check-throw-new-error.sh`** — a grep-based CI script that fails if
   `throw new Error(` appears in any production `.ts`/`.tsx` file under `apps/`,
   `packages/`, `agents/`, or `cli/`. Test files (`__tests__/`, `tests/`, `*.test.ts`,
   `*.spec.ts`) and test-runner packages are excluded — BDD step runners and test guard
   assertions follow their own protocol. Wired as `qa:error-pattern` in `project.json`
   and appended to the `pnpm qa` script.

The Biome rules alone cannot distinguish `throw new Error(...)` from
`throw new CustomError(...)` — the grep script closes that gap.

### Sharing AbstractAlistigoError across packages

`AbstractAlistigoError` currently lives in `@alistigo/domain`. Packages that already
depend on it (e.g., `alistigo-artifact-list`, `alistigo-list-components-react`,
`alistigo-claude-artifact-list-storage`) import the base class from `@alistigo/domain`.

Packages that have no relationship to the list domain (e.g., `alistigo-artifact-manager`,
`alistigo-artifact-config-format`) define a local abstract base that replicates the same
pattern (`Object.setPrototypeOf`, `this.name`, `readonly context: ErrorContext`) without
creating an architectural dependency on domain logic. These local bases are marked with
a `// TODO: extend from @alistigo/errors once that package exists` comment.

If cross-package `instanceof AbstractAlistigoError` becomes a requirement, create a
dedicated `@alistigo/errors` package containing only `AbstractAlistigoError` and
`ErrorContext`, move the existing domain base there, and update all packages to depend
on it instead.

## Rationale

| Option | Notes |
|--------|-------|
| **Custom hierarchy (chosen)** | Machine-enforceable, domain-typed, Sentry-friendly |
| Raw `Error` everywhere | Untyped, unenforced, no structured context |
| Result/Either pattern | Good for pure functions; not idiomatic for I/O or validation boundary throws in this codebase |
| `neverthrow` / `ts-results` | Adds a library dependency; incompatible with existing throw-based domain model |

The custom hierarchy pattern is [well-established in the TypeScript community](https://javascript.info/custom-errors)
and requires no additional runtime dependencies.

## Consequences

**Positive:**
- Sentry events carry the leaf class name, not "Error" — faster triage
- `catch (e) { if (e instanceof InvalidListIdError) … }` is now safe and exhaustive
- Context fields are indexable in Sentry's search and alerting UI
- Static analysis gate prevents regressions without code-review overhead

**Negative / trade-offs accepted:**
- ~5 lines of boilerplate per new error class (one-time, per class)
- Existing raw `throw new Error(...)` calls must be migrated before `qa:error-pattern` passes
- Hierarchy depth must be managed — keep to 3 levels maximum (root → domain → leaf)

## Alternatives considered

- **`neverthrow` / `fp-ts` Either** — rejected: Result-style error handling is a good pattern for
  pure functions but requires a pervasive refactor of the existing throw-based domain model and
  adds a library dependency. Out of scope for this ADR.
- **String error codes only** — rejected: loses TypeScript type narrowing and `instanceof` support.
- **`AggregateError`** — rejected: for multiple simultaneous errors; not applicable here.
