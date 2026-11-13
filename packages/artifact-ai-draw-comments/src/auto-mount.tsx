import { createRoot } from "react-dom/client";
import { App } from "./App.js";

const MOUNT_ID = "ai-draw-comments-root";

let rootInstance: ReturnType<typeof createRoot> | null = null;

function getContainerSelector(config: unknown): string | null {
  const cfg = config as { drawComments?: { container?: unknown } } | null;
  const sel = cfg?.drawComments?.container;
  return typeof sel === "string" ? sel : null;
}

function resolveContainer(config: unknown): HTMLElement {
  const selector = getContainerSelector(config);
  if (selector !== null) {
    const el = document.querySelector(selector);
    if (el instanceof HTMLElement) return el;
  }
  return document.body;
}

function parseConfig(): unknown {
  try {
    const el = document.getElementById("alistigo-config");
    return el !== null ? JSON.parse(el.textContent ?? "{}") : {};
  } catch {
    return {};
  }
}

export function mount(container: HTMLElement): void {
  if (document.getElementById(MOUNT_ID) !== null) return;
  const root = document.createElement("div");
  root.id = MOUNT_ID;
  container.prepend(root);
  rootInstance = createRoot(root);
  rootInstance.render(<App />);
}

export function unmount(): void {
  rootInstance?.unmount();
  rootInstance = null;
  document.getElementById(MOUNT_ID)?.remove();
}

function autoMount() {
  const config = parseConfig();
  const container = resolveContainer(config);
  mount(container);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoMount);
} else {
  autoMount();
}
