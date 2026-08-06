import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";

interface StorageExplorerConfig {
  app?: string;
  container?: string;
  prefix?: string;
}

function parseConfig(): StorageExplorerConfig {
  const el = document.getElementById("alistigo-config");
  if (el === null) return {};
  try {
    return JSON.parse(el.textContent ?? "{}") as StorageExplorerConfig;
  } catch {
    console.error("[StorageExplorer] Failed to parse #alistigo-config:", el.textContent);
    return {};
  }
}

function resolveContainer(selector?: string): HTMLElement {
  if (selector) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) return el;
  }
  const div = document.createElement("div");
  div.id = "alistigo-root";
  div.style.height = "100vh";
  div.style.overflow = "hidden";
  document.body.appendChild(div);
  return div;
}

export function autoMount(): void {
  const config = parseConfig();
  const container = resolveContainer(config.container);
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App prefix={config.prefix ?? ""} />
    </StrictMode>,
  );
}
