import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { boundariesCheck } from "./boundaries.js";
import {
  cleanupRoot,
  connects,
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

function twoNodeCalm() {
  return makeCalmFile(
    [
      node("domain", { "package-name": "{domain}-domain" }),
      node("app", {
        "package-name": "{domain}-app",
        "core-npm-package": "@alistigo/core-app",
      }),
    ],
    [connects("app-to-domain", "app", "domain")],
  );
}

describe("boundariesCheck", () => {
  it("passes when all @alistigo deps are CALM-allowed", async () => {
    const calm = twoNodeCalm();
    await writePackageJson(root, "@alistigo/myart-domain", { name: "@alistigo/myart-domain" });
    await writePackageJson(root, "@alistigo/myart-app", {
      name: "@alistigo/myart-app",
      dependencies: {
        "@alistigo/myart-domain": "^1.0.0",
        "@alistigo/core-app": "^1.0.0",
      },
    });

    const result = await boundariesCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.checkId).toBe("boundaries");
  });

  it("fails when a package declares a forbidden @alistigo dep", async () => {
    const calm = twoNodeCalm();
    await writePackageJson(root, "@alistigo/myart-domain", {});
    await writePackageJson(root, "@alistigo/myart-app", {
      dependencies: { "@alistigo/forbidden-pkg": "^1.0.0" },
    });

    const result = await boundariesCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]!.packageName).toBe("@alistigo/myart-app");
    expect(result.issues[0]!.message).toContain("@alistigo/forbidden-pkg");
  });

  it("checks devDependencies and peerDependencies too", async () => {
    const calm = twoNodeCalm();
    await writePackageJson(root, "@alistigo/myart-domain", {});
    await writePackageJson(root, "@alistigo/myart-app", {
      devDependencies: { "@alistigo/dev-forbidden": "^1.0.0" },
      peerDependencies: { "@alistigo/peer-forbidden": "^1.0.0" },
    });

    const result = await boundariesCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(false);
    expect(result.issues).toHaveLength(2);
  });

  it("skips skill nodes", async () => {
    const calm = makeCalmFile([
      node("sk", { "node-type": "skill", "package-name": "{domain}-skill" }),
    ]);
    await writePackageJson(root, "@alistigo/myart-skill", {
      dependencies: { "@alistigo/anything": "^1.0.0" },
    });

    const result = await boundariesCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(true);
  });

  it("skips packages whose package.json is missing (module-existence handles that)", async () => {
    const calm = twoNodeCalm();
    // neither package written to disk

    const result = await boundariesCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("exempts deps with alistigo.type = 'tool'", async () => {
    const calm = twoNodeCalm();
    await writePackageJson(root, "@alistigo/myart-domain", {});
    await writePackageJson(root, "@alistigo/myart-app", {
      dependencies: { "@alistigo/my-build-tool": "^1.0.0" },
    });
    await writePackageJson(root, "@alistigo/my-build-tool", {
      alistigo: { type: "tool" },
    });

    const result = await boundariesCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(true);
  });

  it("exempts deps with alistigo.type = 'plugin'", async () => {
    const calm = twoNodeCalm();
    await writePackageJson(root, "@alistigo/myart-domain", {});
    await writePackageJson(root, "@alistigo/myart-app", {
      dependencies: { "@alistigo/my-plugin": "^1.0.0" },
    });
    await writePackageJson(root, "@alistigo/my-plugin", {
      alistigo: { type: "plugin" },
    });

    const result = await boundariesCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(true);
  });

  it("allows the node's own core-npm-package as a dep", async () => {
    const calm = twoNodeCalm();
    await writePackageJson(root, "@alistigo/myart-domain", {});
    await writePackageJson(root, "@alistigo/myart-app", {
      dependencies: { "@alistigo/core-app": "^1.0.0" },
    });

    const result = await boundariesCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(true);
  });

  it("allows the impl package of a connected destination node", async () => {
    const calm = twoNodeCalm();
    await writePackageJson(root, "@alistigo/myart-domain", {});
    await writePackageJson(root, "@alistigo/myart-app", {
      dependencies: { "@alistigo/myart-domain": "^1.0.0" },
    });

    const result = await boundariesCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(true);
  });

  it("reports one issue per forbidden dep", async () => {
    const calm = twoNodeCalm();
    await writePackageJson(root, "@alistigo/myart-domain", {});
    await writePackageJson(root, "@alistigo/myart-app", {
      dependencies: {
        "@alistigo/forbidden-a": "^1.0.0",
        "@alistigo/forbidden-b": "^1.0.0",
      },
    });

    const result = await boundariesCheck.run(makeContext(root, calm));

    expect(result.passed).toBe(false);
    expect(result.issues).toHaveLength(2);
  });
});
