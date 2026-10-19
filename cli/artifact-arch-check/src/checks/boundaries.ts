import { getCheckableNodes, readPackageJson, resolvePackageDir } from "../calm/reader.js";
import type { CalmNode, CalmRelationship } from "../calm/types.js";
import type { CheckContext, CheckDefinition, CheckIssue, CheckResult } from "./types.js";

/**
 * Derive which @alistigo/* packages each node is allowed to depend on,
 * based on the "connects" relationships in the CALM file.
 */
function buildAllowedDepsMap(
  nodes: CalmNode[],
  relationships: CalmRelationship[],
): Map<string, Set<string>> {
  const nodeMap = new Map(nodes.map((n) => [n["unique-id"], n]));
  const allowed = new Map<string, Set<string>>();

  for (const node of nodes) {
    if (node["core-npm-package"] !== undefined) {
      allowed.set(node["unique-id"], new Set<string>());
    }
  }

  for (const rel of relationships) {
    const connects = rel["relationship-type"].connects;
    if (connects === undefined) continue;

    const sourceId = connects.source.node;
    const destId = connects.destination.node;
    const destNode = nodeMap.get(destId);
    const destPkg = destNode?.["core-npm-package"];

    if (destPkg !== undefined) {
      const set = allowed.get(sourceId) ?? new Set<string>();
      set.add(destPkg);
      allowed.set(sourceId, set);
    }
  }

  return allowed;
}

async function run(ctx: CheckContext): Promise<CheckResult> {
  const issues: CheckIssue[] = [];
  const nodes = getCheckableNodes(ctx.calmFile);
  const allowedMap = buildAllowedDepsMap(ctx.calmFile.nodes, ctx.calmFile.relationships);

  for (const node of nodes) {
    const pkg = node["core-npm-package"];
    if (pkg === undefined) continue;

    // Skill nodes have no runtime code dependencies by architectural decree
    if (node["node-type"] === "skill") continue;

    const pkgDir = resolvePackageDir(ctx.workspaceRoot, pkg);
    let pkgJson: Record<string, unknown>;
    try {
      pkgJson = await readPackageJson(pkgDir);
    } catch {
      continue; // module-existence check will catch missing packages
    }

    const allDeps: Record<string, string> = {
      ...((pkgJson["dependencies"] as Record<string, string> | undefined) ?? {}),
      ...((pkgJson["devDependencies"] as Record<string, string> | undefined) ?? {}),
      ...((pkgJson["peerDependencies"] as Record<string, string> | undefined) ?? {}),
    };

    const alistigoDeps = Object.keys(allDeps).filter((d) => d.startsWith("@alistigo/"));

    const allowed = allowedMap.get(node["unique-id"]) ?? new Set<string>();

    for (const dep of alistigoDeps) {
      if (!allowed.has(dep)) {
        issues.push({
          packageName: pkg,
          message: `Declares forbidden dependency ${dep}`,
          fix: `Remove ${dep} from ${pkg.replace(/^@[^/]+\//, "")}/package.json, or update the CALM relationships`,
          docsRef: `packages/architecture/docs/architecture.md#ddd-layers — source: ${ctx.calmFilePath}`,
        });
      }
    }
  }

  return {
    checkId: boundariesCheck.id,
    checkName: boundariesCheck.name,
    passed: issues.length === 0,
    issues,
  };
}

export const boundariesCheck: CheckDefinition = {
  id: "boundaries",
  name: "Dependency Boundaries",
  run,
};
