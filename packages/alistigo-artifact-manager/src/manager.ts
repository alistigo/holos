import { validateArtifactConfig } from "@alistigo/artifact-config-format";
import { ARTIFACT_REGISTRY } from "./registry.js";

/**
 * Initialise an Alistigo artifact on the current page.
 *
 * Accepts either a raw (unknown) value or an already-validated ArtifactConfig.
 * Validates the config, resolves the CDN URL from the internal registry, and
 * injects a `<script>` tag into `document.head` to boot the artifact.
 *
 * @throws {TypeError} if the config shape is invalid (delegated to validateArtifactConfig).
 * @throws {Error} if `config.app` is not found in the internal artifact registry.
 */
export function initArtifactManager(config: unknown): void {
  const validated = validateArtifactConfig(config);

  const cdnUrl = ARTIFACT_REGISTRY[validated.app];
  if (cdnUrl === undefined) {
    throw new Error(
      `Artifact manager: unknown artifact app "${validated.app}". ` +
        `Known apps: ${Object.keys(ARTIFACT_REGISTRY).join(", ")}`,
    );
  }

  const script = document.createElement("script");
  script.src = cdnUrl;
  document.head.appendChild(script);
}
