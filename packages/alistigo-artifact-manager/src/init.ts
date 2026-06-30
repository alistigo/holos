import { validateArtifactConfig } from "@alistigo/artifact-config-format";
import { ARTIFACT_REGISTRY } from "./registry.js";

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

  const script = document.createElement("script");
  script.src = cdnUrl;
  document.head.appendChild(script);
}
