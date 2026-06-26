import "@alistigo/artifact-list";

import { createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";

import DevFixturePicker from "./components/DevFixturePicker.js";

// Inject URL params into #alistigo-config before DOMContentLoaded fires.
// @alistigo/artifact-list registers DOMContentLoaded → autoMount on import,
// so these writes are visible to autoMount even though the import comes first.
const params = new URLSearchParams(window.location.search);
if (params.has("readonly") || params.has("lang") || params.has("app")) {
  let configEl = document.getElementById("alistigo-config") as HTMLScriptElement | null;
  if (!configEl) {
    configEl = document.createElement("script");
    configEl.type = "application/json";
    configEl.id = "alistigo-config";
    document.head.appendChild(configEl);
  }
  const cfg: Record<string, unknown> = {};
  if (params.has("app")) cfg.app = params.get("app");
  if (params.has("readonly")) cfg.readonly = params.get("readonly") === "true";
  if (params.has("lang")) cfg.lang = params.get("lang");
  configEl.textContent = JSON.stringify(cfg);
}

const toolsEl = document.getElementById("dev-tools");
if (toolsEl) {
  createRoot(toolsEl).render(createElement(StrictMode, null, createElement(DevFixturePicker)));
}
