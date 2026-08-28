import type { PersonLeaf, SoftwareApplicationLeaf } from "schema-dts";

export const ALISTIGO_CONTEXT = {
  "@vocab": "https://schema.org/",
  alistigo: "https://alistigo.ai/vocab/",
} as const;

export type AlistigoContext = typeof ALISTIGO_CONTEXT;

export type IdentityThing = {
  identifier: string;
  name: string;
};

export type Person = PersonLeaf & IdentityThing;
export type SoftwareApplication = SoftwareApplicationLeaf & IdentityThing;
export type Agent = Person | SoftwareApplication;

export interface Plugin extends IdentityThing {
  version?: string;
  config?: Record<string, unknown>;
}
