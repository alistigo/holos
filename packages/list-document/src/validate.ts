import alistigoDocumentSchema from "@alistigo/core-document/schemas/alistigo-document.json" with {
  type: "json",
};
import documentSchema from "./schemas/document.json" with { type: "json" };

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// schema.org's `Thing` (base of ItemList) defines @context as {type:"string"},
// which conflicts with our @context object. Register a permissive stub for the
// schema:ItemList $ref so it resolves without enforcing schema.org constraints.
// The installed schema-org-json-schemas package is used for schema flattening
// (via $RefParser.bundle) where AJV is not involved.
const SCHEMA_ORG_STUBS = [
  { $id: "schema:Thing", type: "object" },
  { $id: "schema:Action", type: "object" },
  { $id: "schema:Person", type: "object" },
  { $id: "schema:SoftwareApplication", type: "object" },
  { $id: "schema:ItemList", type: "object" },
  { $id: "schema:ListItem", type: "object" },
] as const;

/**
 * Validate that an unknown JSON value conforms to the Alistigo document schema.
 *
 * Lazily resolves `ajv` and `ajv-formats` from the consumer's node_modules so
 * we don't pull them in for non-validating consumers.
 */
export async function validateDocument(input: unknown): Promise<ValidationResult> {
  // biome-ignore lint/suspicious/noExplicitAny: dynamic import of optional peer
  const Ajv = (await import("ajv/dist/2020.js")).default as any;
  // biome-ignore lint/suspicious/noExplicitAny: dynamic import of optional peer
  const addFormats = (await import("ajv-formats")).default as any;

  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  for (const stub of SCHEMA_ORG_STUBS) ajv.addSchema(stub);
  ajv.addSchema(alistigoDocumentSchema);

  const validate = ajv.compile(documentSchema);
  const valid = validate(input) as boolean;
  const errors = (validate.errors ?? []).map((e: { instancePath: string; message?: string }) =>
    `${e.instancePath || "/"} ${e.message ?? ""}`.trim(),
  );
  return { valid, errors };
}
