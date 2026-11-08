import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { moduleExistenceCheck } from "./module-existence.js";
import {
  cleanupRoot,
  connects,
  createTempRoot,
  makeCalmFile,
  makeContext,
  node,
  writeEmptyDir,
  writePackageJson,
} from "./test-helpers.js";

let root: string;

beforeEach(async () => {
  root = await createTempRoot();
});

afterEach(async () => {
  await cleanupRoot(root);
});

describe("moduleExistenceCheck", () => {
  it("passes when all packages exist with package.json", async () => {
    const calm = makeCalmFile([node("domain", { "package-name": "{domain}-domain" })]);
    await writePackageJson(root, "@alistigo/myart-domain", { name: "@alistigo/myart-domain" });

    const result = await moduleExistenceCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.checkId).toBe("module-existence");
  });

  it("fails when package directory is missing", async () => {
    const calm = makeCalmFile([node("domain", { "package-name": "{domain}-domain" })]);

    const result = await moduleExistenceCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]!.packageName).toBe("@alistigo/myart-domain");
    expect(result.issues[0]!.message).toContain("Package not found");
    expect(result.issues[0]!.fix).toContain("bash scripts/new-package.sh");
    expect(result.issues[0]!.fix).toContain("myart-domain");
  });

  it("fails with specific message when dir exists but package.json is absent", async () => {
    const calm = makeCalmFile([node("domain", { "package-name": "{domain}-domain" })]);
    await writeEmptyDir(root, "@alistigo/myart-domain");

    const result = await moduleExistenceCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(false);
    expect(result.issues[0]!.message).toContain("no package.json");
  });

  it("skips plugin nodes even when they have package-name", async () => {
    const calm = makeCalmFile([
      node("storage", { "node-type": "plugin", "package-name": "{domain}-storage" }),
    ]);

    const result = await moduleExistenceCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("skips nodes without package-name", async () => {
    const calm = makeCalmFile([node("shared", { "core-npm-package": "@alistigo/shared" })]);

    const result = await moduleExistenceCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(true);
  });

  it("reports one issue per missing package", async () => {
    const calm = makeCalmFile([
      node("domain", { "package-name": "{domain}-domain" }),
      node("app", { "package-name": "{domain}-app" }),
    ]);
    await writePackageJson(root, "@alistigo/myart-domain", {});
    // myart-app is intentionally missing

    const result = await moduleExistenceCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]!.packageName).toBe("@alistigo/myart-app");
  });

  it("includes a docs reference in every issue", async () => {
    const calm = makeCalmFile([node("x", { "package-name": "{domain}-x" })]);

    const result = await moduleExistenceCheck.run(makeContext(root, calm));

    expect(result.issues[0]!.docsRef).toBeTruthy();
  });

  it("passes for CALM files with no checkable nodes", async () => {
    const calm = makeCalmFile(
      [node("shared", { "core-npm-package": "@alistigo/shared" })],
      [connects("r1", "shared", "shared")],
    );

    const result = await moduleExistenceCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(true);
  });
});
