import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { getCheckableNodes, resolvePackageDir } from "../calm/reader.js";
import type { CheckContext, CheckDefinition, CheckIssue, CheckResult } from "./types.js";

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function buildPluginSystemNodeIds(ctx: CheckContext): Set<string> {
  const ids = new Set<string>();
  for (const rel of ctx.calmFile.relationships) {
    const composedOf = rel["relationship-type"]["composed-of"];
    if (composedOf !== undefined && composedOf.container === "plugin-system") {
      for (const nodeId of composedOf.nodes) {
        ids.add(nodeId);
      }
    }
  }
  return ids;
}

async function run(ctx: CheckContext): Promise<CheckResult> {
  const issues: CheckIssue[] = [];
  const nodes = getCheckableNodes(ctx.calmFile);
  const pluginSystemIds = buildPluginSystemNodeIds(ctx);

  for (const node of nodes) {
    const pkg = node["core-npm-package"];
    if (pkg === undefined) continue;

    if (node["node-type"] === "plugin") continue;
    if (pluginSystemIds.has(node["unique-id"])) continue;

    const pkgDir = resolvePackageDir(ctx.workspaceRoot, pkg);
    const pkgJsonPath = resolve(pkgDir, "package.json");

    const dirOk = await exists(pkgDir);
    const jsonOk = dirOk && (await exists(pkgJsonPath));

    if (!jsonOk) {
      const shortName = pkg.replace(/^@[^/]+\//, "");
      const issue: CheckIssue = {
        packageName: pkg,
        message: dirOk
          ? `Directory packages/${shortName}/ exists but has no package.json`
          : `Package not found at packages/${shortName}/`,
        fix: `bash scripts/new-package.sh ${shortName}`,
        docsRef: "packages/architecture/docs/arch-check.md",
      };
      issues.push(issue);
    }
  }

  return {
    checkId: moduleExistenceCheck.id,
    checkName: moduleExistenceCheck.name,
    passed: issues.length === 0,
    issues,
  };
}

export const moduleExistenceCheck: CheckDefinition = {
  id: "module-existence",
  name: "Module Existence",
  run,
};
