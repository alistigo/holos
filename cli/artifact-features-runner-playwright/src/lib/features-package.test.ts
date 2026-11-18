import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { countTodoScenarios, loadFeaturesPackage } from "./features-package.js";

/**
 * These tests exist to prove two claims the spec makes but the two real
 * features packages cannot demonstrate on their own:
 *
 *  - **SC-005** "adding a third features package requires no new harness code —
 *    only `.feature` files, domain step definitions, package metadata, and the
 *    artifact's own targets". Built here from nothing but those parts.
 *  - **FR-014** the runner registers the harness "including one that exports no
 *    support directory of its own". Both shipped packages export one, so that
 *    branch was previously satisfied only by construction.
 *
 * Scope, stated plainly: this proves the *loader* accepts such a package and
 * reports no support directory. It does not boot a browser, so it is evidence
 * for the package contract, not for a full scenario run.
 */

const roots: string[] = [];

/** A features package consisting only of metadata, a feature file and a step file. */
function makeMinimalFeaturesPackage(options: { withSupportDir: boolean }): string {
  const root = mkdtempSync(path.join(tmpdir(), "features-pkg-"));
  roots.push(root);
  const pkgDir = path.join(root, "node_modules", "@fixture", "minimal-features");
  mkdirSync(path.join(pkgDir, "features"), { recursive: true });
  mkdirSync(path.join(pkgDir, "dist", "step-definitions"), { recursive: true });

  writeFileSync(
    path.join(pkgDir, "package.json"),
    JSON.stringify({
      name: "@fixture/minimal-features",
      version: "0.0.0",
      type: "module",
      alistigo: { type: "features", domain: "minimal" },
      exports: { ".": { import: "./dist/index.js" } },
      main: "./dist/index.js",
    }),
  );

  writeFileSync(
    path.join(pkgDir, "features", "minimal.feature"),
    [
      "Feature: A minimal features package",
      "",
      "  @P1",
      "  Scenario: It is discovered by the runner",
      "    Given a features package with only features and step definitions",
      "    Then the runner can load it",
      "",
      "  @todo",
      "  Scenario: Not implemented yet",
      "    Given something unbuilt",
      "",
    ].join("\n"),
  );

  writeFileSync(path.join(pkgDir, "dist", "step-definitions", "minimal.steps.js"), "export {};\n");

  const support = options.withSupportDir
    ? 'export const SUPPORT_DIR = path.resolve(__d, "support");\n'
    : "";
  if (options.withSupportDir) mkdirSync(path.join(pkgDir, "dist", "support"));

  writeFileSync(
    path.join(pkgDir, "dist", "index.js"),
    [
      'import path from "node:path";',
      'import { fileURLToPath } from "node:url";',
      "const __d = path.dirname(fileURLToPath(import.meta.url));",
      'export const FEATURES_DIR = path.resolve(__d, "..", "features");',
      'export const STEP_DEFINITIONS_DIR = path.resolve(__d, "step-definitions");',
      support,
    ].join("\n"),
  );

  return root;
}

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

describe("loadFeaturesPackage — the features-package contract", () => {
  test("accepts a package built from features, step definitions and metadata alone", async () => {
    const from = makeMinimalFeaturesPackage({ withSupportDir: false });
    const outcome = await loadFeaturesPackage("@fixture/minimal-features", from);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.pkg.domain).toBe("minimal");
    expect(outcome.pkg.featureFiles).toEqual(["minimal.feature"]);
  });

  test("reports no support directory when the package exports none (FR-014)", async () => {
    const from = makeMinimalFeaturesPackage({ withSupportDir: false });
    const outcome = await loadFeaturesPackage("@fixture/minimal-features", from);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    // The runner omits the support glob for this case and still imports the
    // harness registration module, so the shared World is registered anyway.
    expect(outcome.pkg.supportDir).toBeUndefined();
  });

  test("picks up a support directory when the package does export one", async () => {
    const from = makeMinimalFeaturesPackage({ withSupportDir: true });
    const outcome = await loadFeaturesPackage("@fixture/minimal-features", from);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.pkg.supportDir).toContain("support");
  });

  test("rejects a package that is not declared as a features package", async () => {
    const from = makeMinimalFeaturesPackage({ withSupportDir: false });
    const pkgJson = path.join(from, "node_modules", "@fixture", "minimal-features", "package.json");
    const { readFileSync } = await import("node:fs");
    const parsed = JSON.parse(readFileSync(pkgJson, "utf8")) as Record<string, unknown>;
    parsed["alistigo"] = { type: "application" };
    writeFileSync(pkgJson, JSON.stringify(parsed));

    const outcome = await loadFeaturesPackage("@fixture/minimal-features", from);
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.detail).toContain("not a features package");
  });

  test("names the package it could not resolve", async () => {
    const outcome = await loadFeaturesPackage("@fixture/absent-features", tmpdir());
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.detail).toContain("cannot resolve");
  });
});

describe("countTodoScenarios — keeping excluded work visible", () => {
  test("counts scenarios tagged @todo", () => {
    const from = makeMinimalFeaturesPackage({ withSupportDir: false });
    const featuresDir = path.join(from, "node_modules", "@fixture", "minimal-features", "features");
    expect(countTodoScenarios(featuresDir, ["minimal.feature"])).toBe(1);
  });

  test("counts every scenario when the Feature itself carries the tag", () => {
    const root = mkdtempSync(path.join(tmpdir(), "features-todo-"));
    roots.push(root);
    writeFileSync(
      path.join(root, "all-todo.feature"),
      [
        "@todo @artifact-plugins",
        "Feature: Entirely unimplemented",
        "",
        "  Scenario: One",
        "    Given a",
        "",
        "  Scenario: Two",
        "    Given b",
        "",
        "  Scenario Outline: Three",
        "    Given <x>",
        "",
      ].join("\n"),
    );
    expect(countTodoScenarios(root, ["all-todo.feature"])).toBe(3);
  });

  test("counts nothing when no scenario is tagged", () => {
    const root = mkdtempSync(path.join(tmpdir(), "features-none-"));
    roots.push(root);
    writeFileSync(
      path.join(root, "plain.feature"),
      ["Feature: All implemented", "", "  @P1", "  Scenario: One", "    Given a", ""].join("\n"),
    );
    expect(countTodoScenarios(root, ["plain.feature"])).toBe(0);
  });

  test("ignores a feature file it cannot read", () => {
    expect(countTodoScenarios(tmpdir(), ["does-not-exist.feature"])).toBe(0);
  });
});
