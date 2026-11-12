import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dirNameMatchCheck } from "./dir-name-match.js";
import {
  cleanupRoot,
  createTempRoot,
  makeCalmFile,
  makeContext,
  writePackageJson,
} from "./test-helpers.js";

let root: string;

beforeEach(async () => {
  root = await createTempRoot();
});

afterEach(async () => {
  await cleanupRoot(root);
});

async function writePackageJsonInDir(
  root: string,
  dirPath: string,
  content: Record<string, unknown>,
): Promise<void> {
  await mkdir(join(root, dirPath), { recursive: true });
  await writeFile(join(root, dirPath, "package.json"), JSON.stringify(content));
}

describe("dirNameMatchCheck", () => {
  it("passes when scoped package name matches dir name", async () => {
    await writePackageJson(root, "@alistigo/my-pkg", { name: "@alistigo/my-pkg" });

    const result = await dirNameMatchCheck.run(makeContext(root, makeCalmFile([])));

    expect(result.passed).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.checkId).toBe("dir-name-match");
  });

  it("fails when dir name does not match unscoped package name", async () => {
    await writePackageJsonInDir(root, "packages/logger", {
      name: "@alistigo/pino-logger-plugin",
    });

    const result = await dirNameMatchCheck.run(makeContext(root, makeCalmFile([])));

    expect(result.passed).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]!.message).toContain("packages/logger");
    expect(result.issues[0]!.message).toContain("@alistigo/pino-logger-plugin");
    expect(result.issues[0]!.message).toContain("packages/pino-logger-plugin");
    expect(result.issues[0]!.fix).toContain("git mv packages/logger packages/pino-logger-plugin");
  });

  it("passes for unscoped package name when dir matches", async () => {
    await writePackageJsonInDir(root, "packages/my-tool", { name: "my-tool" });

    const result = await dirNameMatchCheck.run(makeContext(root, makeCalmFile([])));

    expect(result.passed).toBe(true);
  });

  it("skips directories with no package.json", async () => {
    await mkdir(join(root, "packages", "empty-dir"), { recursive: true });

    const result = await dirNameMatchCheck.run(makeContext(root, makeCalmFile([])));

    expect(result.passed).toBe(true);
  });

  it("skips packages with no name field", async () => {
    await writePackageJsonInDir(root, "packages/some-dir", { version: "1.0.0" });

    const result = await dirNameMatchCheck.run(makeContext(root, makeCalmFile([])));

    expect(result.passed).toBe(true);
  });

  it("scans cli/ subdirectories too", async () => {
    await writePackageJsonInDir(root, "cli/wrong-name", { name: "@alistigo/right-name" });

    const result = await dirNameMatchCheck.run(makeContext(root, makeCalmFile([])));

    expect(result.passed).toBe(false);
    expect(result.issues[0]!.message).toContain("cli/wrong-name");
  });

  it("scans apps/ subdirectories too", async () => {
    await writePackageJson(root, "@alistigo/my-app", { name: "@alistigo/my-app" }, "apps");

    const result = await dirNameMatchCheck.run(makeContext(root, makeCalmFile([])));

    expect(result.passed).toBe(true);
  });

  it("reports one issue per mismatched directory", async () => {
    await writePackageJsonInDir(root, "packages/old-name-a", { name: "@alistigo/new-name-a" });
    await writePackageJsonInDir(root, "packages/old-name-b", { name: "@alistigo/new-name-b" });

    const result = await dirNameMatchCheck.run(makeContext(root, makeCalmFile([])));

    expect(result.passed).toBe(false);
    expect(result.issues).toHaveLength(2);
  });
});
