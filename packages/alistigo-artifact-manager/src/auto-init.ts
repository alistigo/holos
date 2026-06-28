import { initArtifactManager } from "./manager.js";

function displayError(message: string): void {
  const el = document.createElement("div");
  el.style.cssText =
    "color:red;font-family:monospace;padding:1em;border:2px solid red;margin:1em;border-radius:4px";
  el.textContent = `@alistigo/artifact-manager: ${message}`;
  document.body.prepend(el);
}

function readConfig(): unknown | undefined {
  const configEl = document.getElementById("alistigo-manager-config");
  if (configEl === null) {
    displayError(
      'Missing required <script id="alistigo-manager-config" type="application/json"> tag.',
    );
    return undefined;
  }
  try {
    return JSON.parse(configEl.textContent ?? "");
  } catch {
    displayError("Could not parse JSON from #alistigo-manager-config.");
    return undefined;
  }
}

function ensureAppDiv(): void {
  if (document.getElementById("app") === null) {
    const appDiv = document.createElement("div");
    appDiv.id = "app";
    document.body.appendChild(appDiv);
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function autoInit(): void {
  const config = readConfig();
  if (config === undefined) return;

  ensureAppDiv();

  try {
    initArtifactManager(config);
  } catch (err) {
    displayError(errorMessage(err));
  }
}
