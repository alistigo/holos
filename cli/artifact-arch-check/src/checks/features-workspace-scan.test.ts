import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { scanFeaturesPackages } from "./features-workspace-scan.js";
import { cleanupRoot, createTempRoot, writePackageJson } from "./test-helpers.js";

let root: string;

beforeEach(async () => {
  root = await createTempRoot();
});

afterEach(async () => {
  await cleanupRoot(root);
});

const COMPLIANT = {
  name: "@alistigo/list-features",
  alistigo: { type: "features", domain: "list" },
};

describe("scanFeaturesPackages", () => {
  it("returns empty array when no features packages exist", async () => {
    await writePackageJson(root, "@alistigo/list-domain", {
      name: "@alistigo/list-domain",
      alistigo: { type: "domain" },
    });

    const results = await scanFeaturesPackages(root);

    expect(results).toHaveLength(0);
  });

  it("passes for a fully compliant features package", async () => {
    await writePackageJson(root, "@alistigo/list-features", COMPLIANT);

    const results = await scanFeaturesPackages(root);

    expect(results).toHaveLength(1);
    expect(results[0]?.issues).toHaveLength(0);
    expect(results[0]?.packageName).toBe("@alistigo/list-features");
  });

  it("skips packages where alistigo.type is not 'features'", async () => {
    await writePackageJson(root, "@alistigo/list-domain", {
      name: "@alistigo/list-domain",
      alistigo: { type: "domain" },
      dependencies: {},
    });

    const results = await scanFeaturesPackages(root);

    expect(results).toHaveLength(0);
  });

  it("skips packages with no alistigo field", async () => {
    await writePackageJson(root, "@alistigo/no-metadata", {
      name: "@alistigo/no-metadata",
    });

    const results = await scanFeaturesPackages(root);

    expect(results).toHaveLength(0);
  });

  // fallow-ignore-next-line complexity
  it("fails features/naming-convention when name does not end with -features", async () => {
    await writePackageJson(root, "@alistigo/list-feats", {
      name: "@alistigo/list-feats",
      alistigo: { type: "features", domain: "list" },
    });

    const results = await scanFeaturesPackages(root);

    expect(results).toHaveLength(1);
    const issues = results[0]?.issues ?? [];
    expect(issues).toHaveLength(1);
    expect(issues[0]?.rule).toBe("features/naming-convention");
    expect(issues[0]?.message).toContain("list-feats");
  });

  it("fails features/domain-required when alistigo.domain is absent", async () => {
    await writePackageJson(root, "@alistigo/list-features", {
      name: "@alistigo/list-features",
      alistigo: { type: "features" },
    });

    const results = await scanFeaturesPackages(root);

    expect(results[0]?.issues[0]?.rule).toBe("features/domain-required");
  });

  it("fails features/domain-required when alistigo.domain is an empty string", async () => {
    await writePackageJson(root, "@alistigo/list-features", {
      name: "@alistigo/list-features",
      alistigo: { type: "features", domain: "" },
    });

    const results = await scanFeaturesPackages(root);

    expect(results[0]?.issues[0]?.rule).toBe("features/domain-required");
  });

  // fallow-ignore-next-line complexity
  it("fails features/domain-consistent when domain does not match the name prefix", async () => {
    await writePackageJson(root, "@alistigo/list-features", {
      name: "@alistigo/list-features",
      alistigo: { type: "features", domain: "todo" },
    });

    const results = await scanFeaturesPackages(root);

    const issues = results[0]?.issues ?? [];
    expect(issues).toHaveLength(1);
    expect(issues[0]?.rule).toBe("features/domain-consistent");
    expect(issues[0]?.message).toContain('"todo"');
    expect(issues[0]?.message).toContain('"list"');
  });

  it("fails features/domain-unique when two distinct packages claim the same domain", async () => {
    // @alistigo/list-features in packages/ and @acme/list-features in cli/ both have domain "list"
    await writePackageJson(root, "@alistigo/list-features", COMPLIANT, "packages");
    await writePackageJson(
      root,
      "@acme/list-features",
      { name: "@acme/list-features", alistigo: { type: "features", domain: "list" } },
      "cli",
    );

    const results = await scanFeaturesPackages(root);

    const withDomainUnique = results.flatMap((r) =>
      r.issues.filter((i) => i.rule === "features/domain-unique"),
    );
    expect(withDomainUnique.length).toBeGreaterThanOrEqual(1);
  });

  it("deduplicates the same package found under two paths — domain-unique is not fired", async () => {
    // Same package name in packages/ and a dist/ cache copy
    await writePackageJson(root, "@alistigo/list-features", COMPLIANT, "packages");
    const cacheDir = join(root, "dist", "list-features");
    await mkdir(cacheDir, { recursive: true });
    await writeFile(join(cacheDir, "package.json"), JSON.stringify(COMPLIANT));

    const results = await scanFeaturesPackages(root);

    // Both paths appear in raw results, but domain-unique is not fired (same package name)
    const domainUniqueIssues = results.flatMap((r) =>
      r.issues.filter((i) => i.rule === "features/domain-unique"),
    );
    expect(domainUniqueIssues).toHaveLength(0);
  });

  it("reports multiple violations on the same package", async () => {
    await writePackageJson(root, "@alistigo/list-feats", {
      name: "@alistigo/list-feats",
      alistigo: { type: "features" }, // bad name AND missing domain
    });

    const results = await scanFeaturesPackages(root);

    expect(results[0]?.issues).toHaveLength(2);
    const rules = results[0]?.issues.map((i) => i.rule);
    expect(rules).toContain("features/naming-convention");
    expect(rules).toContain("features/domain-required");
  });

  const PASSING_CASES: Array<[string, string, Record<string, unknown>]> = [
    [
      "passes for a scoped package name",
      "@alistigo/list-features",
      { name: "@alistigo/list-features", alistigo: { type: "features", domain: "list" } },
    ],
    [
      "passes for an unscoped package name",
      "list-features",
      { name: "list-features", alistigo: { type: "features", domain: "list" } },
    ],
  ];

  it.each(PASSING_CASES)("%s", async (_label, pkgName, pkgJson) => {
    await writePackageJson(root, pkgName, pkgJson);

    const results = await scanFeaturesPackages(root);

    expect(results[0]?.issues).toHaveLength(0);
  });
});
