import type { PluginHostInfo, PluginLogger, PluginRuntime } from "@alistigo/artifact-plugin-api";
import { createPluginRuntime } from "@alistigo/artifact-plugin-api";
import type { AlistigoDocument } from "@alistigo/document-format";
import { createLogger } from "@alistigo/logger";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import type { ErrorInfo, ReactNode } from "react";
import { Component, createElement, Fragment, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import pkg from "../package.json" with { type: "json" };
import App from "./components/App.js";
import { bootI18n } from "./i18n.js";
import { loadPlugins } from "./plugins.js";
import { registerLoadedPlugins, registerMount } from "./runtime-state.js";
import { resolveContainer } from "./utils/container.js";
import makeDefaultDocument from "./utils/document.js";

const log = createLogger("alistigo:artifact-list");

// Adapts the pino-based logger to the plugin API's minimal PluginLogger shape.
const pluginLogger: PluginLogger = {
  info: (obj, msg) => log.info(obj as Record<string, unknown>, msg),
  error: (obj, msg) => log.error(obj as Record<string, unknown>, msg),
};

// Locale is a build-time constant baked via VITE_LOCALE define in vite.config.ts.
const LOCALE = (import.meta.env.VITE_LOCALE as string | undefined) ?? "en";

const roots = new Map<Element, Root>();

export interface MountOptions {
  /** Pre-populated document to seed the list. Defaults to an empty list. */
  document?: AlistigoDocument;
  /**
   * BCP-47 locale code. No effect at runtime — locale is fixed at build
   * time via the LOCALE env var. Provided for documentation only.
   */
  locale?: string;
  /** Plugins to load, keyed by npm package name, each with its own config object. */
  plugins?: Record<string, Record<string, unknown>>;
}

function detectStorageType(): string {
  if (typeof window !== "undefined" && "storage" in window) return "window.storage";
  if (typeof localStorage !== "undefined") return "localStorage";
  return "none";
}

function getContainerLabel(container: string | HTMLElement, el: Element): string {
  return typeof container === "string" ? container : `#${(el as HTMLElement).id || "(element)"}`;
}

function getOrCreateRoot(el: Element): Root {
  const existing = roots.get(el);
  if (existing !== undefined) return existing;
  const fresh = createRoot(el);
  roots.set(el, fresh);
  return fresh;
}

interface ArtifactErrorBoundaryProps {
  onError: (error: unknown, componentStack: string | undefined) => void;
  children?: ReactNode;
}

interface ArtifactErrorBoundaryState {
  hasError: boolean;
}

/**
 * Host-owned, generic error boundary — no Sentry dependency. Render errors are
 * surfaced as an "error:uncaught" event on the plugin bus; the Sentry plugin (if
 * loaded) subscribes to it, but the boundary itself works with zero plugins.
 */
class ArtifactErrorBoundary extends Component<
  ArtifactErrorBoundaryProps,
  ArtifactErrorBoundaryState
> {
  override state: ArtifactErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ArtifactErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
    this.props.onError(error, errorInfo.componentStack ?? undefined);
  }

  override render(): ReactNode {
    if (this.state.hasError) return createElement(Fragment, null);
    return this.props.children;
  }
}

function renderApp(el: Element, options: MountOptions, runtime: PluginRuntime): void {
  const doc = options.document ?? makeDefaultDocument();
  const tree = createElement(
    StrictMode,
    null,
    createElement(
      I18nProvider,
      { i18n },
      createElement(
        ArtifactErrorBoundary,
        {
          onError: (error, componentStack) => {
            runtime.bus.emit("error:uncaught", {
              error,
              ...(componentStack !== undefined && { componentStack }),
            });
          },
        },
        createElement(App, { key: doc["alistigo:listId"], initialDocument: doc }),
      ),
    ),
  );
  getOrCreateRoot(el).render(runtime.wrapRoot(tree));
}

function deferUntilDomReady(container: string | HTMLElement, options: MountOptions): void {
  console.info("[Alistigo] mount() called before DOM is ready — deferring to DOMContentLoaded");
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      void mount(container, options);
    },
    { once: true },
  );
}

function resolveContainerOrThrow(container: string | HTMLElement): Element {
  const el = resolveContainer(container);
  if (el == null) {
    log.error({ selector: String(container) }, "container not found");
    throw new Error(`Alistigo.mount: container not found: ${String(container)}`);
  }
  return el;
}

/**
 * Mount the Alistigo list widget into `container`.
 * Calling mount() a second time on the same container updates the existing
 * root instead of creating a new one — safe to call from fixture pickers.
 */
export async function mount(
  container: string | HTMLElement,
  options: MountOptions = {},
): Promise<void> {
  if (document.readyState === "loading") {
    deferUntilDomReady(container, options);
    return;
  }

  const el = resolveContainerOrThrow(container);
  const isFirstMount = !roots.has(el);
  registerMount(getContainerLabel(container, el));
  log.info({ selector: String(container) }, "mount called");

  const plugins = await loadPlugins(options.plugins);
  const host: PluginHostInfo = {
    packageName: "@alistigo/artifact-list",
    version: pkg.version,
    locale: LOCALE,
    environment: import.meta.env.MODE,
  };
  const runtime = createPluginRuntime(plugins, host, pluginLogger, options.plugins ?? {});
  registerLoadedPlugins(runtime.loadedPluginNames);

  await runtime.setup();
  bootI18n();
  await runtime.beforeMount();
  renderApp(el, options, runtime);
  await runtime.mounted();

  if (isFirstMount) {
    runtime.bus.emit("widget:displayed", {
      locale: LOCALE,
      storageType: detectStorageType(),
      version: pkg.version,
    });
  }
}
