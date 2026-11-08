import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { packageConformanceCheck } from "./package-conformance.js";
import {
  cleanupRoot,
  createTempRoot,
  makeCalmFile,
  makeContext,
  node,
  writePackageJson,
} from "./test-helpers.js";

let root: string;

beforeEach(async () => {
  root = await createTempRoot();
});

afterEach(async () => {
  await cleanupRoot(root);
});

const COMPLIANT_PKG = {
  name: "@alistigo/myart-domain",
  version: "1.0.0",
  license: "MIT",
  type: "module",
  exports: "./dist/index.js",
  main: "./dist/index.js",
  types: "./dist/index.d.ts",
  files: ["dist"],
  publishConfig: { access: "public" },
};

describe("packageConformanceCheck", () => {
  it("passes when all required fields are present", async () => {
    const calm = makeCalmFile([node("domain", { "package-name": "{domain}-domain" })]);
    await writePackageJson(root, "@alistigo/myart-domain", COMPLIANT_PKG);

    const result = await packageConformanceCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.checkId).toBe("package-conformance");
  });

  it("fails when top-level fields are missing", async () => {
    const calm = makeCalmFile([node("domain", { "package-name": "{domain}-domain" })]);
    const { name, version, ...withoutSome } = COMPLIANT_PKG;
    await writePackageJson(root, "@alistigo/myart-domain", withoutSome);

    const result = await packageConformanceCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]!.message).toContain("name");
    expect(result.issues[0]!.message).toContain("version");
  });

  it("fails when publishConfig is missing entirely", async () => {
    const calm = makeCalmFile([node("domain", { "package-name": "{domain}-domain" })]);
    const { publishConfig: _, ...withoutPublishConfig } = COMPLIANT_PKG;
    await writePackageJson(root, "@alistigo/myart-domain", withoutPublishConfig);

    const result = await packageConformanceCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(false);
    expect(result.issues[0]!.message).toContain("publishConfig.access");
  });

  it("fails when publishConfig exists but has no access field", async () => {
    const calm = makeCalmFile([node("domain", { "package-name": "{domain}-domain" })]);
    await writePackageJson(root, "@alistigo/myart-domain", {
      ...COMPLIANT_PKG,
      publishConfig: {},
    });

    const result = await packageConformanceCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(false);
    expect(result.issues[0]!.message).toContain("publishConfig.access");
  });

  it("includes a fix hint pointing to the template script", async () => {
    const calm = makeCalmFile([node("domain", { "package-name": "{domain}-domain" })]);
    await writePackageJson(root, "@alistigo/myart-domain", { name: "@alistigo/myart-domain" });

    const result = await packageConformanceCheck.run(makeContext(root, calm));

    expect(result.issues[0]!.fix).toContain("new-package.sh");
  });

  it("skips skill nodes", async () => {
    const calm = makeCalmFile([
      node("sk", { "node-type": "skill", "package-name": "{domain}-skill" }),
    ]);
    await writePackageJson(root, "@alistigo/myart-skill", { name: "@alistigo/myart-skill" });

    const result = await packageConformanceCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(true);
  });

  it("skips packages with missing package.json (module-existence handles that)", async () => {
    const calm = makeCalmFile([node("domain", { "package-name": "{domain}-domain" })]);
    // package not written to disk

    const result = await packageConformanceCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(true);
  });

  it("reports one issue per non-conformant package", async () => {
    const calm = makeCalmFile([
      node("domain", { "package-name": "{domain}-domain" }),
      node("app", { "package-name": "{domain}-app" }),
    ]);
    await writePackageJson(root, "@alistigo/myart-domain", { name: "only-name" });
    await writePackageJson(root, "@alistigo/myart-app", { name: "only-name" });

    const result = await packageConformanceCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(false);
    expect(result.issues).toHaveLength(2);
  });
});
