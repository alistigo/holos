export type TypeIDString = string;

export const ALISTIGO_CONTEXT = {
  "@vocab": "https://schema.org/",
  alistigo: "https://alistigo.ai/vocab/",
} as const;

export type AlistigoContext = typeof ALISTIGO_CONTEXT;

export interface AlistigoActorRecord {
  "alistigo:actorId": TypeIDString;
  "alistigo:userId": string;
  "alistigo:pseudo": string;
  "alistigo:avatar": string; // base64 SVG data URL
}

export interface AlistigoPluginRecord {
  name: string;
  version?: string;
  config?: Record<string, unknown>;
}
