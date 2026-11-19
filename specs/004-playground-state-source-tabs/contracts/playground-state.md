# Contract: Persisted Playground State

**Module**: `apps/alistigo-artifact-playground/src/playground-state.ts`
**Consumers**: `src/hooks/useHostConfig.ts` (only)
**Tests**: `src/playground-state.test.ts` (`bun test`)

The module is **pure**: it never touches `localStorage`, `window`, or `import.meta.env`. The hook
reads and writes storage and passes strings in and out. That is what makes the rules below
testable without a DOM (the app has no browser-capable runner).

## Surface

`Config`, `PlaygroundMode` and `PlaygroundCatalog` are all declared in
`src/playground-config.ts`, which imports nothing. That placement is load-bearing: `Config` used
to live in `hooks/useHostConfig.ts`, and since this module types every signature with it while the
hook imports this module, leaving it there would create an import cycle — and `.dependency-cruiser.cjs`
counts type-only imports (`tsPreCompilationDeps: true`) with `no-circular` at `severity: "error"`.
`constants.ts` is the only module that reads `ARTIFACT_REGISTRY`, and it builds the catalogue the
pure code is handed.

```ts
/** localStorage key. MUST NOT start with "alistigo" — see R-1. */
export const PLAYGROUND_STATE_KEY = "dev-playground:config:v1";

/** Envelope version. Bump only on a shape change field fallbacks cannot absorb. */
export const PLAYGROUND_STATE_VERSION = 1;

/** What the pure code is allowed to know about the live playground.
 *  Declared in playground-config.ts; built by constants.ts. */
export interface PlaygroundCatalog {
  /** Valid values for Config.app, in registry order; the first is the fallback. */
  readonly knownApps: readonly string[];
  /** Valid plugin package names for a given artifact. */
  readonly pluginsFor: (app: string) => readonly string[];
  /** Valid fixture names for Config.document, beside "" and "__raw__". */
  readonly documentNames: readonly string[];
  /** False in a production build, where the Source field is not offered. */
  readonly modeSelectable: boolean;
}

/** The defaults a fresh playground starts from. */
export function defaultConfig(catalog: PlaygroundCatalog, defaultApp?: string): Config;

/** Config → the string to store. Never throws. */
export function serializePlaygroundState(config: Config): string;

/**
 * Stored string → the fields that survived validation.
 * Returns {} for absent, malformed, wrong-version or unusable input. Never throws.
 */
export function parsePlaygroundState(
  raw: string | null,
  catalog: PlaygroundCatalog,
): Partial<Config>;

/** defaults ◁ stored ◁ url, in that order. Pure. */
export function composeConfig(
  defaults: Config,
  stored: Partial<Config>,
  overrides: Partial<Config>,
): Config;
```

## Rules

| ID | Rule |
|----|------|
| C-1 | `PLAYGROUND_STATE_KEY` does not start with `alistigo`, so the Storage explorer never lists it (FR-006). A test asserts the prefix. |
| C-2 | `parsePlaygroundState(null, …)` → `{}`. |
| C-3 | Non-JSON input → `{}`. No throw. |
| C-4 | `v` missing or ≠ `PLAYGROUND_STATE_VERSION` → `{}`, even when `config` looks valid. |
| C-5 | `config` absent or not a plain object → `{}`. |
| C-6 | `app` is kept only if it is in `catalog.knownApps`; otherwise the field is omitted. |
| C-7 | `plugins` keys are filtered against `pluginsFor(effective app)`, where *effective* means the restored `app` if it survived C-6, else the default. A non-object plugin value becomes `{}`. |
| C-8 | `document` is kept only if it is `""`, `"__raw__"`, or in `catalog.documentNames`. |
| C-9 | `aiContext` is kept only if it is one of the playground's AI contexts; `mode` only if it is `"dev"` or `"prod-local"`, and only when `catalog.modeSelectable` is true. |
| C-10 | `lang` / `rawMarkdown` must be strings; `readonly` / `published` must be booleans. A wrong type omits that field, it does not coerce it. |
| C-11 | One invalid field never discards a valid one (FR-004). A test restores an object with a bad `app` and a good `lang` and asserts `lang` survives. |
| C-12 | `serializePlaygroundState` output round-trips: `parsePlaygroundState(serialize(c), catalog)` equals `c` for any `c` whose fields are all valid for that catalogue. |
| C-13 | `composeConfig` takes later arguments as higher precedence, per field, and ignores `undefined` fields. |

## Hook responsibilities (not this module's)

| ID | Rule |
|----|------|
| H-1 | Read once on init; compute the initial `Config` with `composeConfig(defaultConfig(…), parsePlaygroundState(read(), …), parseUrlOverrides(…))`. |
| H-2 | Write on every `Config` change, through `serializePlaygroundState`. |
| H-3 | Every storage call is wrapped; a throw is swallowed and the app continues without persistence (FR-005). A `localStorage` that throws on read must not blank the form, and one that throws on write must not break typing. |
| H-4 | No storage read after init — the restored value is state from then on, so a second tab's write cannot yank the form out from under the developer mid-session. |
| H-5 | After the Clear Data control runs, the hook re-writes the envelope. `clearData()` clears `iframe.contentWindow.localStorage`, and the `srcdoc` iframe carries `allow-same-origin`, so that is an origin-wide clear which removes this key too; because the persist effect is keyed on `config`, which did not change, nothing would rewrite it and the setup would disappear at the next page load with no visible cause (FR-022). Narrowing the clear to `alistigo`-prefixed keys is **not** the fix: the list artifact persists under the bare key `document`, which such a filter would stop clearing. |
