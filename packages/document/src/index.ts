import type { PersonLeaf, SoftwareApplicationLeaf } from "schema-dts";

export type TypeIDString = string;

export const ALISTIGO_CONTEXT = {
  "@vocab": "https://schema.org/",
  alistigo: "https://alistigo.ai/vocab/",
} as const;

export type AlistigoContext = typeof ALISTIGO_CONTEXT;

// Human agent — aligns with schema.org Person
export interface AlistigoPersonAgent extends PersonLeaf {
  "alistigo:agentId": TypeIDString;
  "alistigo:userId": string;
  name: string;
  image?: string;
}

// AI agent — aligns with schema.org SoftwareApplication
export interface AlistigoAIAgent extends SoftwareApplicationLeaf {
  "alistigo:agentId": TypeIDString;
  name: string;
  image?: string;
}

export type AlistigoAgentRecord = AlistigoPersonAgent | AlistigoAIAgent;

export interface AlistigoPluginRecord {
  name: string;
  version?: string;
  config?: Record<string, unknown>;
}
