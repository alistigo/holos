interface AlistigoConfig {
  app?: string;
}

function readConfig(): AlistigoConfig {
  const raw = document.getElementById("alistigo-config")?.textContent;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as AlistigoConfig;
  } catch {
    return {};
  }
}

const { app } = readConfig();

switch (app) {
  case "@alistigo/artifact-claude-capabilities-demo":
    await import("@alistigo/artifact-claude-capabilities-demo");
    break;
  case "@alistigo/artifact-ai-draw-comments":
    // The host surface this widget annotates is injected into the iframe srcdoc
    // (see buildIframeSrcdoc.ts), not here: in a production/preview build this
    // module is not used at all — the iframe loads the artifact bundle straight
    // from the registry URL — so markup added here would only exist in dev.
    await import("@alistigo/artifact-ai-draw-comments");
    break;
  default:
    await import("@alistigo/artifact-list");
    break;
}
