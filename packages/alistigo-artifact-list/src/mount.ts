import type { AlistigoDocument } from "@alistigo/document-format";
import { createLogger } from "@alistigo/logger";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { ErrorBoundary } from "@sentry/react";
import { createElement, Fragment, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import pkg from "../package.json" with { type: "json" };
import { initAnalytics, trackWidgetDisplayed } from "./analytics.js";
import App from "./components/App.js";
import { MountContainerNotFoundError } from "./errors/artifact-list-error.js";
import { bootI18n } from "./i18n.js";
import { registerMount } from "./runtime-state.js";
import { resolveContainer } from "./utils/container.js";
import makeDefaultDocument from "./utils/document.js";

const log = createLogger("alistigo:artifact-list");

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

function renderApp(el: Element, options: MountOptions): void {
  const doc = options.document ?? makeDefaultDocument();
  getOrCreateRoot(el).render(
    createElement(
      StrictMode,
      null,
      createElement(
        I18nProvider,
        { i18n },
        createElement(
          ErrorBoundary,
          { fallback: createElement(Fragment, null) },
          createElement(App, { key: doc["alistigo:listId"], initialDocument: doc }),
        ),
      ),
    ),
  );
}

/**
 * Mount the Alistigo list widget into `container`.
 * Calling mount() a second time on the same container updates the existing
 * root instead of creating a new one — safe to call from fixture pickers.
 */
export function mount(container: string | HTMLElement, options: MountOptions = {}): void {
  if (document.readyState === "loading") {
    console.info("[Alistigo] mount() called before DOM is ready — deferring to DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", () => mount(container, options), { once: true });
    return;
  }

  const el = resolveContainer(container);
  if (el == null) {
    log.error({ selector: String(container) }, "container not found");
    throw new MountContainerNotFoundError(String(container));
  }

  const isFirstMount = !roots.has(el);
  registerMount(getContainerLabel(container, el));
  log.info({ selector: String(container) }, "mount called");
  bootI18n();
  initAnalytics(LOCALE, pkg.version);
  renderApp(el, options);

  if (isFirstMount) {
    trackWidgetDisplayed({
      locale: LOCALE,
      storageType: detectStorageType(),
      version: pkg.version,
    });
  }
}
