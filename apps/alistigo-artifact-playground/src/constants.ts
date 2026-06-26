import { ARTIFACT_REGISTRY } from "@alistigo/artifact-manager";

export const KNOWN_APPS = Object.keys(ARTIFACT_REGISTRY) as string[];
export const AI_CONTEXTS = ["claude"] as const;
