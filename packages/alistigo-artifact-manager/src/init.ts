import { validateArtifactConfig } from "@alistigo/artifact-config-format";
import {
  MountTargetNotFoundError,
  UnknownArtifactAppError,
} from "./errors/artifact-manager-error.js";
import { ARTIFACT_REGISTRY } from "./registry.js";

/**
 * Initialise an Alistigo artifact on the current page.
 *
 * @param selector - CSS selector for the target mount element.
 * @param config   - Raw artifact config (validated internally).
 *
 * @throws {TypeError} if the config shape is invalid.
 * @throws {UnknownArtifactAppError} if `config.app` is not found in the registry.
 * @throws {MountTargetNotFoundError} if `selector` matches no element in the document.
 */
export default function init(selector: string, config: unknown): void {
  const validated = validateArtifactConfig(config);

  const cdnUrl = ARTIFACT_REGISTRY[validated.app];
  if (cdnUrl === undefined) {
    throw new UnknownArtifactAppError(validated.app, Object.keys(ARTIFACT_REGISTRY));
  }

  const target = document.querySelector(selector);
  if (target === null) {
    throw new MountTargetNotFoundError(selector);
  }

  if ((target as HTMLElement).id !== "app") {
    (target as HTMLElement).id = "app";
  }

  const script = document.createElement("script");
  script.src = cdnUrl;
  document.head.appendChild(script);
}
