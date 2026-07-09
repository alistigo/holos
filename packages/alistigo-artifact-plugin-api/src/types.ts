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
}

/**
 * Unified plugin interface. Lifecycle hooks (setup/beforeMount/mounted/destroy) and
 * the event bus (on/emit via PluginContext) serve artifact-lifecycle/infra plugins
 * (Sentry, PostHog). dataShape/render/commands/events are forward-compat stubs for
 * future domain-contribution plugins (e.g. a checkbox-element plugin) — typed here,
 * not consumed by any host yet.
 */
export interface AlistigoPlugin {
  /** Must match this plugin's own npm package name. */
  name: string;

  setup?(ctx: PluginContext): void | Promise<void>;
  beforeMount?(ctx: PluginContext): void | Promise<void>;
  mounted?(ctx: PluginContext): void | Promise<void>;
  destroy?(ctx: PluginContext): void | Promise<void>;

  /** Reserved for a future Provider-style plugin. Unused by any plugin in this round. */
  wrapRoot?(tree: ReactNode, ctx: PluginContext): ReactNode;

  // Forward-compat stubs for future domain-contribution plugins — typed, unconsumed.
  dataShape?: unknown;
  render?: unknown;
  commands?: Record<string, (...args: unknown[]) => unknown>;
  events?: Record<string, unknown>;
}
