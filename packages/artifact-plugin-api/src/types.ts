import type { ReactNode } from "react";

/**
 * Typed event map for the host<->plugin event bus. Every event a host emits and
 * every event a plugin can subscribe to is declared here.
 */
export interface AlistigoPluginEventMap {
  /** Emitted once, on first mount only. */
  "widget:displayed": { locale: string; storageType: string; version: string };
  /** Emitted by the host's own error boundary whenever a React render error occurs. */
  "error:uncaught": { error: unknown; componentStack?: string };
  /** Emitted when the active user identity changes. */
  "user:changed": { userId: string; pseudo: string; avatar?: string };
}

export type PluginEventName = keyof AlistigoPluginEventMap;

export interface PluginEventBus {
  /** Subscribe to an event. Returns an unsubscribe function. */
  on<E extends PluginEventName>(
    event: E,
    handler: (payload: AlistigoPluginEventMap[E]) => void,
  ): () => void;
  /** Emit an event to every current subscriber. */
  emit<E extends PluginEventName>(event: E, payload: AlistigoPluginEventMap[E]): void;
}

export interface PluginHostInfo {
  /** The hosting artifact's own npm package name, e.g. "@alistigo/artifact-list". */
  packageName: string;
  /** The hosting artifact's own version — NOT the plugin's own version. */
  version: string;
  locale: string;
  environment: string;
}

export interface PluginLogger {
  info(obj: unknown, msg?: string): void;
  error(obj: unknown, msg?: string): void;
}

export interface PluginContext {
  /** This plugin's own config sub-object: config.plugins[this.name] ?? {}. Opaque — each plugin narrows/validates its own shape. */
  config: Record<string, unknown>;
  host: PluginHostInfo;
  logger: PluginLogger;
  on: PluginEventBus["on"];
  emit: PluginEventBus["emit"];
  /** Optional key-value store provided by the active storage plugin. */
  store?: KeyValueStore;
}

export type PluginType = "monitoring" | "storage" | (string & {});

/** Generic key-value store — no domain knowledge. Values are JSON-serialisable objects. */
export interface KeyValueStore {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  del(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
}

export interface AlistigoStorageExtension {
  isAvailable(): boolean;
  createStore(): KeyValueStore;
  listKeys(prefix?: string): Promise<Array<{ key: string; value: string }>>;
  seedIfEmpty?(document: unknown): Promise<void>;
}

/**
 * Unified plugin interface. Lifecycle hooks (setup/beforeMount/mounted/destroy) and
 * the event bus (on/emit via PluginContext) serve artifact-lifecycle/infra plugins
 * (Sentry, PostHog). Domain-contribution fields (metadataKey/reduce/renderListElementLeading)
 * serve list-element plugins (e.g. checkbox) that extend document schema and contribute UI slots.
 */
export interface AlistigoPlugin {
  /** Must match this plugin's own npm package name. */
  name: string;
  /** The plugin's own npm package version, injected at build time from package.json. */
  version?: string;
  /** Plugin category — informational, enables type-based queries by the host. */
  type?: PluginType;
  /**
   * Whether this plugin is the active one in its category within the current artifact context.
   * Set by the host at runtime — e.g. only one storage plugin can be active at a time.
   */
  active?: boolean;
  /** Present when type === "storage". Provides the storage backend contract. */
  storage?: AlistigoStorageExtension;
  /** Plugin names that must be present in the same runtime for this plugin to function. */
  requires?: string[];

  setup?(ctx: PluginContext): void | Promise<void>;
  beforeMount?(ctx: PluginContext): void | Promise<void>;
  mounted?(ctx: PluginContext): void | Promise<void>;
  destroy?(ctx: PluginContext): void | Promise<void>;

  /** Reserved for a future Provider-style plugin. Unused by any plugin in this round. */
  wrapRoot?(tree: ReactNode, ctx: PluginContext): ReactNode;
  /** Renders a status badge to the left of the context menu toggle button. */
  renderStatusBadge?(onToggle: () => void): ReactNode;
  /** Renders content inside the context menu panel (e.g. an "Edit user" button). */
  renderMenuContent?(): ReactNode;

  /** The key this plugin writes under alistigo:metadatas on each list element (prevents namespace collisions). */
  metadataKey?: string;
  /** JSON schema fragment describing this plugin's per-element metadata shape (documentation/validation). */
  metadataSchema?: unknown;
  /**
   * Pure reducer: given the element ID, current per-element metadata, and a new event, returns
   * updated metadata. Called by the host for every event in the log for every element — the
   * reducer must check elementId against the event's listElementId to filter irrelevant events.
   * The event param is typed unknown — the plugin implementation narrows it to its own event types.
   */
  reduce?: (
    elementId: string,
    elementMetadata: Record<string, unknown>,
    event: unknown,
  ) => Record<string, unknown>;
  /**
   * Renders UI at the leading edge of a list element (e.g. a checkbox).
   * The plugin must not import anything from the host package.
   */
  renderListElementLeading?: (
    elementId: string,
    metadata: Record<string, unknown>,
    onCommand: (name: string, payload: unknown) => void,
  ) => ReactNode;
}
