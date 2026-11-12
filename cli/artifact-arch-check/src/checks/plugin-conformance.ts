import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { readPackageJson } from "../calm/reader.js";
import type { CheckContext, CheckDefinition, CheckIssue, CheckResult } from "./types.js";

const PLUGIN_NAME_PATTERN = /^@[^/]+\/.+-plugin$/;
const REACT_RUNTIME_DEPS = ["react", "react-dom"];
const SCAN_DIRS = ["packages", "cli", "apps"];

// fallow-ignore-next-line complexity
async function collectPluginPackages(
  workspaceRoot: string,
): Promise<Array<{ pkgName: string; pkgJson: Record<string, unknown> }>> {
  const results: Array<{ pkgName: string; pkgJson: Record<string, unknown> }> = [];

  for (const dir of SCAN_DIRS) {
    let entries: string[];
    try {
      entries = await readdir(join(workspaceRoot, dir));
    } catch {
      continue;
    }

    for (const entry of entries) {
      try {
        const pkgJson = await readPackageJson(join(workspaceRoot, dir, entry));
        const alistigo = pkgJson.alistigo;
        if (
          typeof alistigo !== "object" ||
          alistigo === null ||
          (alistigo as Record<string, unknown>).type !== "plugin"
        ) {
          continue;
        }
        const pkgName = typeof pkgJson.name === "string" ? pkgJson.name : entry;
        results.push({ pkgName, pkgJson });
      } catch {
        // no package.json or unreadable — skip
      }
    }
  }

  return results;
}

// fallow-ignore-next-line complexity
async function run(ctx: CheckContext): Promise<CheckResult> {
  const issues: CheckIssue[] = [];
  const plugins = await collectPluginPackages(ctx.workspaceRoot);

  for (const { pkgName, pkgJson } of plugins) {
    if (!PLUGIN_NAME_PATTERN.test(pkgName)) {
      issues.push({
        packageName: pkgName,
        message: `Package name "${pkgName}" does not end with "-plugin"`,
        fix: `Rename to "${pkgName}-plugin" (or adjust to match @scope/<something>-plugin) and update all references`,
        docsRef: "cli/artifact-arch-check/README.md#plugin-conformance",
      });
    }

    const deps = pkgJson.dependencies as Record<string, string> | undefined;
    if (deps !== undefined) {
      for (const reactPkg of REACT_RUNTIME_DEPS) {
        if (reactPkg in deps) {
          issues.push({
            packageName: pkgName,
            message: `"${reactPkg}" is listed in dependencies; plugins must not bundle React`,
            fix: `Move "${reactPkg}" from dependencies to peerDependencies in ${pkgName.replace(/^@[^/]+\//, "")}/package.json`,
            docsRef: "cli/artifact-arch-check/README.md#plugin-conformance",
          });
        }
      }
    }
  }

  return {
    checkId: pluginConformanceCheck.id,
    checkName: pluginConformanceCheck.name,
    passed: issues.length === 0,
    issues,
  };
}

export const pluginConformanceCheck: CheckDefinition = {
  id: "plugin-conformance",
  name: "Plugin Conformance",
  run,
};
