import "@alistigo/artifact-list";

import type { AlistigoDocument } from "@alistigo/document-format";

// Eager fixture map — tree-shaken out of prod builds.
const FIXTURES_RAW = import.meta.glob<AlistigoDocument>("../fixtures/*.json", {
  eager: true,
  import: "default",
});

// Inject URL params into #alistigo-config before DOMContentLoaded fires.
// @alistigo/artifact-list registers DOMContentLoaded → autoMount on import,
// so these writes are visible to autoMount even though the import comes first.
const params = new URLSearchParams(window.location.search);
if (params.has("readonly") || params.has("lang") || params.has("app") || params.has("plugins")) {
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
  if (params.has("plugins")) {
    try {
      cfg.plugins = JSON.parse(params.get("plugins") ?? "{}");
    } catch {
      console.error("[Playground] Failed to parse plugins query param");
    }
  }
  configEl.textContent = JSON.stringify(cfg);
}

// If the host selected a document fixture, replace the inline #alistigo-document
// script tag so auto-mount picks up the chosen fixture instead of the default.
const documentName = params.get("document");
if (documentName != null) {
  const fixtureKey = Object.keys(FIXTURES_RAW).find((k) =>
    k.endsWith(`/${documentName}.json`),
  );
  if (fixtureKey != null) {
    const doc = FIXTURES_RAW[fixtureKey];
    let docEl = document.getElementById("alistigo-document") as HTMLScriptElement | null;
    if (!docEl) {
      docEl = document.createElement("script");
      docEl.type = "application/json";
      docEl.id = "alistigo-document";
      document.body.prepend(docEl);
    }
    docEl.textContent = JSON.stringify(doc);
  }
}
