import { validateArtifactConfig } from "@alistigo/artifact-config-format";
import { ARTIFACT_REGISTRY } from "./registry.js";

// React import map for the artifact ES module and its plugins.
// Must be injected before any <script type="module"> on the page.
// All four specifiers resolve through jsDelivr so the browser module cache
// deduplicates them — artifact and plugins share one React instance.
const REACT_IMPORT_MAP = JSON.stringify({
  imports: {
    react: "https://cdn.jsdelivr.net/npm/react@19/+esm",
    "react/jsx-runtime": "https://cdn.jsdelivr.net/npm/react@19/jsx-runtime/+esm",
    "react-dom": "https://cdn.jsdelivr.net/npm/react-dom@19/+esm",
    "react-dom/client": "https://cdn.jsdelivr.net/npm/react-dom@19/client/+esm",
  },
});

/**
 * Initialise an Alistigo artifact on the current page.
 *
 * @param selector - CSS selector for the target mount element.
 * @param config   - Raw artifact config (validated internally).
 *
 * @throws {TypeError} if the config shape is invalid.
 * @throws {Error} if `config.app` is not found in the registry.
 * @throws {Error} if `selector` matches no element in the document.
 */
// fallow-ignore-next-line complexity
export default function init(selector: string, config: unknown): void {
  const validated = validateArtifactConfig(config);

  const cdnUrl = ARTIFACT_REGISTRY[validated.app]?.cdnUrl;
  if (cdnUrl === undefined) {
    throw new Error(
      `Artifact manager: unknown artifact app "${validated.app}". ` +
        `Known apps: ${Object.keys(ARTIFACT_REGISTRY).join(", ")}`,
    );
  }

  const target = document.querySelector(selector);
  if (target === null) {
    throw new Error(`@alistigo/artifact-manager: no element matches selector "${selector}"`);
  }

  if ((target as HTMLElement).id !== "app") {
    (target as HTMLElement).id = "app";
  }

  // Inject the React import map before the module script.
  // The spec requires import maps to precede all <script type="module"> tags.
  // Skip if one already exists (e.g. second artifact on the same page).
  if (!document.querySelector('script[type="importmap"]')) {
    const importMap = document.createElement("script");
    importMap.type = "importmap";
    importMap.textContent = REACT_IMPORT_MAP;
    document.head.prepend(importMap);
  }

  const script = document.createElement("script");
  script.type = "module";
  script.src = cdnUrl;
  document.head.appendChild(script);
}
