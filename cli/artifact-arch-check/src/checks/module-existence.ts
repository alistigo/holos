import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { getCheckableNodes, resolveImplPackage, resolvePackageDir } from "../calm/reader.js";
import type { CheckContext, CheckDefinition, CheckIssue, CheckResult } from "./types.js";

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// fallow-ignore-next-line complexity
async function run(ctx: CheckContext): Promise<CheckResult> {
  const issues: CheckIssue[] = [];
  const nodes = getCheckableNodes(ctx.calmFile);

  for (const node of nodes) {
    if (node["node-type"] === "plugin") continue;

    const pkg = resolveImplPackage(node, ctx.artifactName);
    if (pkg === undefined) continue;

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
