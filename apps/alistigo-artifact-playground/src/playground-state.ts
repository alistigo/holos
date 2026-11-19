/**
 * The playground's persisted form setup: serialise, parse, sanitise, compose.
 *
 * Pure by design. It never touches `localStorage`, `window` or
 * `import.meta.env` — the hook does that and hands strings in and out — and it
 * never imports `constants.ts`, because that pulls in the artifact registry.
 * Both constraints exist so this module is importable from `bun test`, which
 * has no DOM and cannot resolve Vite's module queries.
 *
 * Its only local import is the type-only one below; see the note in
 * `playground-config.ts` for why those types do not live in the hook.
 */

import {
  AI_CONTEXTS,
  type Config,
  DOCUMENT_NONE,
  DOCUMENT_RAW,
  type PlaygroundCatalog,
  type PlaygroundMode,
} from "./playground-config";

/**
 * localStorage key for the saved setup.
 *
 * MUST NOT start with "alistigo": `useLocalStorageEntries` lists keys by
 * `startsWith("alistigo")` and presents the result to the developer as the
 * artifact's own storage, so an `alistigo`-prefixed key would show up in the
 * Storage explorer as if the artifact had written it (FR-006).
 */
export const PLAYGROUND_STATE_KEY = "dev-playground:config:v1";

/**
 * Envelope version. Bumped only for a shape change the field-level fallbacks
 * below cannot absorb; an unknown version is discarded whole.
 */
export const PLAYGROUND_STATE_VERSION = 1;

const MODES: readonly PlaygroundMode[] = ["dev", "prod-local"];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The setup a playground with nothing saved starts from. */
export function defaultConfig(catalog: PlaygroundCatalog, defaultApp?: string): Config {
  const fallback = catalog.knownApps[0] ?? "";
  const app =
    defaultApp !== undefined && catalog.knownApps.includes(defaultApp) ? defaultApp : fallback;
  return {
    app,
    lang: "en",
    aiContext: "claude",
    readonly: false,
    document: DOCUMENT_NONE,
    rawMarkdown: "",
    plugins: {},
    published: true,
    mode: "dev",
  };
}

/**
 * A partial setup to layer over another.
 *
 * Spelled out rather than `Partial<Config>` because `exactOptionalPropertyTypes`
 * is on, which makes `Partial<Config>` reject an explicitly `undefined` field —
 * and "present but undefined" is exactly what a caller passes for "I have no
 * opinion on this field", which `composeConfig` then skips.
 */
export type ConfigLayer = { [K in keyof Config]?: Config[K] | undefined };

/**
 * Layers partial configurations over a complete one, later arguments winning
 * per field. `undefined` fields are skipped, so a layer cannot blank the layer
 * below by merely mentioning a key.
 */
export function composeConfig(defaults: Config, ...layers: readonly ConfigLayer[]): Config {
  const result: Config = { ...defaults };
  for (const layer of layers) {
    const defined = Object.fromEntries(
      Object.entries(layer).filter(([, value]) => value !== undefined),
    );
    Object.assign(result, defined);
  }
  return result;
}

/** Config → the string to store. Never throws. */
export function serializePlaygroundState(config: Config): string {
  try {
    return JSON.stringify({ v: PLAYGROUND_STATE_VERSION, config });
  } catch {
    // A plugin config holding a cycle would land here. Storing the envelope
    // without it beats storing nothing and losing the rest of the setup.
    return JSON.stringify({ v: PLAYGROUND_STATE_VERSION, config: { ...config, plugins: {} } });
  }
}

/** Keeps `plugins` entries the effective artifact actually offers; repairs non-object values. */
function sanitizePlugins(
  raw: unknown,
  catalog: PlaygroundCatalog,
  effectiveApp: string,
): Record<string, Record<string, unknown>> | undefined {
  if (!isPlainObject(raw)) return undefined;
  const available = catalog.pluginsFor(effectiveApp);
  const plugins: Record<string, Record<string, unknown>> = {};
  for (const [name, value] of Object.entries(raw)) {
    if (!available.includes(name)) continue;
    plugins[name] = isPlainObject(value) ? value : {};
  }
  return plugins;
}

function sanitizeDocument(raw: unknown, catalog: PlaygroundCatalog): string | undefined {
  if (typeof raw !== "string") return undefined;
  if (raw === DOCUMENT_NONE || raw === DOCUMENT_RAW) return raw;
  return catalog.documentNames.includes(raw) ? raw : undefined;
}

function sanitizeMode(raw: unknown, catalog: PlaygroundCatalog): PlaygroundMode | undefined {
  if (!catalog.modeSelectable) return undefined;
  return MODES.includes(raw as PlaygroundMode) ? (raw as PlaygroundMode) : undefined;
}

function assignIfDefined<K extends keyof Config>(
  target: Partial<Config>,
  key: K,
  value: Config[K] | undefined,
): void {
  if (value !== undefined) target[key] = value;
}

/**
 * Stored string → the fields that survived validation.
 *
 * Returns `{}` for an absent, malformed, wrong-version or unusable entry, and
 * drops only the individual fields that fail — one bad field never discards a
 * good one (FR-004). Never throws (FR-005).
 *
 * `app` is resolved first on purpose: `document` and `plugins` are both scoped
 * to an artifact, and validating them against the default rather than the
 * restored artifact would keep keys the chosen artifact cannot load.
 */
// fallow-ignore-next-line complexity
export function parsePlaygroundState(
  raw: string | null,
  catalog: PlaygroundCatalog,
): Partial<Config> {
  if (raw === null || raw === "") return {};

  let envelope: unknown;
  try {
    envelope = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!isPlainObject(envelope)) return {};
  if (envelope.v !== PLAYGROUND_STATE_VERSION) return {};

  const stored = envelope.config;
  if (!isPlainObject(stored)) return {};

  const restored: Partial<Config> = {};

  // app first — the fields below are scoped to it.
  const app =
    typeof stored.app === "string" && catalog.knownApps.includes(stored.app)
      ? stored.app
      : undefined;
  assignIfDefined(restored, "app", app);
  const effectiveApp = app ?? defaultConfig(catalog).app;

  assignIfDefined(restored, "lang", typeof stored.lang === "string" ? stored.lang : undefined);
  assignIfDefined(
    restored,
    "rawMarkdown",
    typeof stored.rawMarkdown === "string" ? stored.rawMarkdown : undefined,
  );
  assignIfDefined(
    restored,
    "readonly",
    typeof stored.readonly === "boolean" ? stored.readonly : undefined,
  );
  assignIfDefined(
    restored,
    "published",
    typeof stored.published === "boolean" ? stored.published : undefined,
  );
  assignIfDefined(
    restored,
    "aiContext",
    typeof stored.aiContext === "string" &&
      (AI_CONTEXTS as readonly string[]).includes(stored.aiContext)
      ? stored.aiContext
      : undefined,
  );
  assignIfDefined(restored, "document", sanitizeDocument(stored.document, catalog));
  assignIfDefined(restored, "mode", sanitizeMode(stored.mode, catalog));
  assignIfDefined(restored, "plugins", sanitizePlugins(stored.plugins, catalog, effectiveApp));

  return restored;
}
