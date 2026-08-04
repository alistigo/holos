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
  case "@alistigo/artifact-storage-explorer":
    await import("@alistigo/artifact-storage-explorer");
    break;
  default:
    await import("@alistigo/artifact-list");
    break;
}
