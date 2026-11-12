import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { pluginConformanceCheck } from "./plugin-conformance.js";
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

const COMPLIANT_PLUGIN = {
  name: "@alistigo/my-thing-plugin",
  alistigo: { type: "plugin" },
};

describe("pluginConformanceCheck", () => {
  it("passes when plugin name ends with -plugin and has no react in dependencies", async () => {
    await writePackageJson(root, "@alistigo/my-thing-plugin", COMPLIANT_PLUGIN);

    const result = await pluginConformanceCheck.run(makeContext(root, makeCalmFile([])));

    expect(result.passed).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.checkId).toBe("plugin-conformance");
  });

  it("fails when plugin name does not end with -plugin", async () => {
    await writePackageJson(root, "@alistigo/my-thing", {
      name: "@alistigo/my-thing",
      alistigo: { type: "plugin" },
    });

    const result = await pluginConformanceCheck.run(makeContext(root, makeCalmFile([])));

    expect(result.passed).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]!.message).toContain('"@alistigo/my-thing"');
    expect(result.issues[0]!.message).toContain('does not end with "-plugin"');
  });

  it("fails when react is in dependencies", async () => {
    await writePackageJson(root, "@alistigo/my-thing-plugin", {
      ...COMPLIANT_PLUGIN,
      dependencies: { react: "^19.0.0" },
    });

    const result = await pluginConformanceCheck.run(makeContext(root, makeCalmFile([])));

    expect(result.passed).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]!.message).toContain('"react"');
    expect(result.issues[0]!.message).toContain("dependencies");
    expect(result.issues[0]!.fix).toContain("peerDependencies");
  });

  it("fails when react-dom is in dependencies", async () => {
    await writePackageJson(root, "@alistigo/my-thing-plugin", {
      ...COMPLIANT_PLUGIN,
      dependencies: { "react-dom": "^19.0.0" },
    });

    const result = await pluginConformanceCheck.run(makeContext(root, makeCalmFile([])));

    expect(result.passed).toBe(false);
    expect(result.issues[0]!.message).toContain('"react-dom"');
  });

  it("passes when react is only in peerDependencies", async () => {
    await writePackageJson(root, "@alistigo/my-thing-plugin", {
      ...COMPLIANT_PLUGIN,
      peerDependencies: { react: "^19.0.0" },
    });

    const result = await pluginConformanceCheck.run(makeContext(root, makeCalmFile([])));

    expect(result.passed).toBe(true);
  });

  it("passes when react is only in devDependencies", async () => {
    await writePackageJson(root, "@alistigo/my-thing-plugin", {
      ...COMPLIANT_PLUGIN,
      devDependencies: { react: "^19.0.0" },
    });

    const result = await pluginConformanceCheck.run(makeContext(root, makeCalmFile([])));

    expect(result.passed).toBe(true);
  });

  it("skips packages that do not have alistigo.type === plugin", async () => {
    await writePackageJson(root, "@alistigo/not-a-plugin", {
      name: "@alistigo/not-a-plugin",
      alistigo: { type: "domain" },
      dependencies: { react: "^19.0.0" },
    });

    const result = await pluginConformanceCheck.run(makeContext(root, makeCalmFile([])));

    expect(result.passed).toBe(true);
  });

  it("skips packages without an alistigo field", async () => {
    await writePackageJson(root, "@alistigo/no-metadata", {
      name: "@alistigo/no-metadata",
    });

    const result = await pluginConformanceCheck.run(makeContext(root, makeCalmFile([])));

    expect(result.passed).toBe(true);
  });

  it("reports one issue per violation — name and react can both fail on same package", async () => {
    await writePackageJson(root, "@alistigo/bad-name", {
      name: "@alistigo/bad-name",
      alistigo: { type: "plugin" },
      dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" },
    });

    const result = await pluginConformanceCheck.run(makeContext(root, makeCalmFile([])));

    expect(result.passed).toBe(false);
    // name violation + react + react-dom = 3 issues
    expect(result.issues).toHaveLength(3);
  });

  it("reports issues for multiple non-conformant plugins", async () => {
    await writePackageJson(root, "@alistigo/plugin-one", {
      name: "@alistigo/plugin-one",
      alistigo: { type: "plugin" },
    });
    await writePackageJson(root, "@alistigo/plugin-two", {
      name: "@alistigo/plugin-two",
      alistigo: { type: "plugin" },
    });

    const result = await pluginConformanceCheck.run(makeContext(root, makeCalmFile([])));

    expect(result.passed).toBe(false);
    expect(result.issues).toHaveLength(2);
  });
});
