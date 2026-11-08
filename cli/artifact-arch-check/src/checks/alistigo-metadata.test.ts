import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { alistigoMetadataCheck } from "./alistigo-metadata.js";
import {
  cleanupRoot,
  createTempRoot,
  makeCalmFile,
  makeContext,
  node,
  writeAlistigoSchema,
  writePackageJson,
} from "./test-helpers.js";

let root: string;

beforeEach(async () => {
  root = await createTempRoot();
  await writeAlistigoSchema(root);
});

afterEach(async () => {
  await cleanupRoot(root);
});

describe("alistigoMetadataCheck", () => {
  it("passes when alistigo.type matches the expected DDD layer", async () => {
    const calm = makeCalmFile([
      node("domain", { "package-name": "{domain}-domain", "ddd-layer": "Domain" }),
    ]);
    await writePackageJson(root, "@alistigo/myart-domain", {
      alistigo: { type: "domain" },
    });

    const result = await alistigoMetadataCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.checkId).toBe("alistigo-metadata");
  });

  it("fails when the alistigo field is missing", async () => {
    const calm = makeCalmFile([
      node("domain", { "package-name": "{domain}-domain", "ddd-layer": "Domain" }),
    ]);
    await writePackageJson(root, "@alistigo/myart-domain", { name: "@alistigo/myart-domain" });

    const result = await alistigoMetadataCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(false);
    expect(result.issues[0]!.message).toContain("Missing");
    expect(result.issues[0]!.fix).toContain('"type": "domain"');
  });

  it("fails when alistigo.type does not match the expected type", async () => {
    const calm = makeCalmFile([
      node("domain", { "package-name": "{domain}-domain", "ddd-layer": "Domain" }),
    ]);
    await writePackageJson(root, "@alistigo/myart-domain", {
      alistigo: { type: "application" },
    });

    const result = await alistigoMetadataCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(false);
    expect(result.issues[0]!.message).toContain('"application"');
    expect(result.issues[0]!.message).toContain('"domain"');
  });

  it("fails when alistigo.type is not a valid schema value", async () => {
    const calm = makeCalmFile([
      node("domain", { "package-name": "{domain}-domain", "ddd-layer": "Domain" }),
    ]);
    await writePackageJson(root, "@alistigo/myart-domain", {
      alistigo: { type: "nonsense" },
    });

    const result = await alistigoMetadataCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(false);
    expect(result.issues[0]!.message).toContain("not a valid type");
  });

  it("infers 'document' type from package name ending with -document", async () => {
    const calm = makeCalmFile([
      node("doc", { "package-name": "{domain}-document", "ddd-layer": "Application" }),
    ]);
    await writePackageJson(root, "@alistigo/myart-document", {
      alistigo: { type: "document" },
    });

    const result = await alistigoMetadataCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(true);
  });

  it("expects 'presentation' for Presentation layer nodes", async () => {
    const calm = makeCalmFile([
      node("ui", { "package-name": "{domain}-ui", "ddd-layer": "Presentation" }),
    ]);
    await writePackageJson(root, "@alistigo/myart-ui", {
      alistigo: { type: "presentation" },
    });

    const result = await alistigoMetadataCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(true);
  });

  it("expects 'skill' for skill-type nodes", async () => {
    const calm = makeCalmFile([
      node("sk", { "node-type": "skill", "package-name": "{domain}-skill" }),
    ]);
    await writePackageJson(root, "@alistigo/myart-skill", {
      alistigo: { type: "skill" },
    });

    const result = await alistigoMetadataCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(true);
  });

  it("falls back to hardcoded types when schema file is missing", async () => {
    const calm = makeCalmFile([
      node("domain", { "package-name": "{domain}-domain", "ddd-layer": "Domain" }),
    ]);
    await writePackageJson(root, "@alistigo/myart-domain", {
      alistigo: { type: "domain" },
    });
    // create a fresh root with no schema file
    const noSchemaRoot = await createTempRoot();
    try {
      await writePackageJson(noSchemaRoot, "@alistigo/myart-domain", {
        alistigo: { type: "domain" },
      });

      const result = await alistigoMetadataCheck.run(makeContext(noSchemaRoot, calm));

      expect(result.passed).toBe(true);
    } finally {
      await cleanupRoot(noSchemaRoot);
    }
  });

  it("skips packages with missing package.json (module-existence handles that)", async () => {
    const calm = makeCalmFile([
      node("domain", { "package-name": "{domain}-domain", "ddd-layer": "Domain" }),
    ]);
    // no package written to disk

    const result = await alistigoMetadataCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(true);
  });

  it("reports one issue per non-conformant package", async () => {
    const calm = makeCalmFile([
      node("domain", { "package-name": "{domain}-domain", "ddd-layer": "Domain" }),
      node("app", { "package-name": "{domain}-app", "ddd-layer": "Application" }),
    ]);
    await writePackageJson(root, "@alistigo/myart-domain", { name: "no-alistigo" });
    await writePackageJson(root, "@alistigo/myart-app", { name: "no-alistigo" });

    const result = await alistigoMetadataCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(false);
    expect(result.issues).toHaveLength(2);
  });
});
