import documentSchema from "./schemas/document.json" with { type: "json" };

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

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

  const validate = ajv.compile(documentSchema);
  const valid = validate(input) as boolean;
  const errors = (validate.errors ?? []).map((e: { instancePath: string; message?: string }) =>
    `${e.instancePath || "/"} ${e.message ?? ""}`.trim(),
  );
  return { valid, errors };
}
