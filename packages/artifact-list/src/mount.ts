import { createElement, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ArtifactRoot } from "./components/ArtifactRoot.js";
import { registerMount } from "./runtime-state.js";
import type { MountOptions } from "./types.js";
import { resolveContainer } from "./utils/container.js";

export type { MountOptions } from "./types.js";

const roots = new Map<Element, Root>();

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

function deferUntilDomReady(container: string | HTMLElement, options: MountOptions): void {
  console.log("[Alistigo] mount() called before DOM is ready — deferring to DOMContentLoaded");
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
    console.error("[Alistigo] container not found", { selector: String(container) });
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
  registerMount(getContainerLabel(container, el));
  console.log("[Alistigo] mount called", { selector: String(container) });

  const tree = createElement(StrictMode, null, createElement(ArtifactRoot, { options }));
  getOrCreateRoot(el).render(tree);
}
