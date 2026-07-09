import { ARTIFACT_REGISTRY } from "@alistigo/artifact-manager";

export const KNOWN_APPS = Object.keys(ARTIFACT_REGISTRY) as string[];
export const AI_CONTEXTS = ["claude"] as const;

/** Plugin package names available for the given artifact type, per the manager's registry. */
export function getAvailablePlugins(app: string): readonly string[] {
  return ARTIFACT_REGISTRY[app]?.availablePlugins ?? [];
}
