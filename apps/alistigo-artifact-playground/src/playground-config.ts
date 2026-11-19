/**
 * The playground's own configuration types, in a module that imports nothing.
 *
 * `Config` used to live in `hooks/useHostConfig.ts`. It cannot stay there: that
 * hook now imports `playground-state.ts` and `playground-url.ts`, and both type
 * their signatures with `Config` — a cycle. `.dependency-cruiser.cjs` runs with
 * `tsPreCompilationDeps: true`, so a type-only import counts as a dependency,
 * and `no-circular` is an error, not a warning. Keeping these declarations in a
 * leaf module is what keeps `qa:arch-check` green.
 *
 * `useHostConfig` re-exports `Config` and `PlaygroundMode`, so every existing
 * importer keeps working unchanged.
 */

/** Controls the artifact script source: "dev" = Vite HMR, "prod-local" = local dist build. */
export type PlaygroundMode = "dev" | "prod-local";

export interface Config {
  app: string;
  lang: string;
  aiContext: string;
  readonly: boolean;
  document: string;
  /** Raw markdown string, used when document === "__raw__". */
  rawMarkdown: string;
  /** Enabled plugins, keyed by npm package name, each with its own (currently empty) config. */
  plugins: Record<string, Record<string, unknown>>;
  /** Simulates a published artifact — injects window.claudeArtifactStatus into the iframe. Only relevant when aiContext === "claude". */
  published: boolean;
  /** Controls the artifact script source: "dev" = Vite HMR, "prod-local" = local dist build. */
  mode: PlaygroundMode;
}

/**
 * What the pure modules are allowed to know about the live playground.
 *
 * Passed in rather than imported, so `playground-state.ts` and
 * `playground-url.ts` never reach for the artifact registry — a test can hand
 * them a three-line stub instead of building the real thing.
 */
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

/**
 * The AI contexts the playground can simulate.
 *
 * Canonical here rather than in `constants.ts`, which pulls in the artifact
 * registry: `playground-state.ts` validates a restored `aiContext` against this
 * list and must stay registry-free. `constants.ts` re-exports it as
 * `AI_CONTEXTS` for the form.
 */
export const AI_CONTEXTS = ["claude", "none"] as const;

/** Document values that are always valid, whatever fixtures exist. */
export const DOCUMENT_NONE = "";
export const DOCUMENT_RAW = "__raw__";
