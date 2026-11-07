import {
  getCheckableNodes,
  readPackageJson,
  resolveImplPackage,
  resolvePackageDir,
  tryResolveWorkspacePackageDir,
} from "../calm/reader.js";
import type { CalmNode, CalmRelationship } from "../calm/types.js";
import type { CheckContext, CheckDefinition, CheckIssue, CheckResult } from "./types.js";

/**
 * Build the set of allowed @alistigo/* deps for each artifact implementation package.
 *
 * For each node with a `package-name`:
 *   - impl pkg = @alistigo/{resolved package-name}
 *   - allowed: own node's `core-npm-package` (the mandatory base dep)
 *   - allowed via each `connects` relationship where this node is the source:
 *       • if destination has `package-name` → resolved impl pkg of dest
 *       • if destination has `core-npm-package` → that value (shared/infra node)
 *       • if destination has BOTH → both values (base contract + impl)
 */
// fallow-ignore-next-line complexity
function buildAllowedDepsMap(
  nodes: CalmNode[],
  relationships: CalmRelationship[],
  artifactName: string,
): Map<string, Set<string>> {
  const nodeMap = new Map(nodes.map((n) => [n["unique-id"], n]));
  const allowed = new Map<string, Set<string>>();

  for (const node of nodes) {
    const impl = resolveImplPackage(node, artifactName);
    if (impl === undefined) continue;

    const deps = new Set<string>();
    // own base dep is always allowed
    if (node["core-npm-package"] !== undefined) {
      deps.add(node["core-npm-package"]);
    }
    allowed.set(impl, deps);
  }

  for (const rel of relationships) {
    const connects = rel["relationship-type"].connects;
    if (connects === undefined) continue;

    const sourceNode = nodeMap.get(connects.source.node);
    if (sourceNode === undefined) continue;
    const sourceImpl = resolveImplPackage(sourceNode, artifactName);
    if (sourceImpl === undefined) continue;

    const deps = allowed.get(sourceImpl);
    if (deps === undefined) continue;

    const destNode = nodeMap.get(connects.destination.node);
    if (destNode === undefined) continue;

    const destImpl = resolveImplPackage(destNode, artifactName);
    if (destImpl !== undefined) deps.add(destImpl);

    const destBase = destNode["core-npm-package"];
    if (destBase !== undefined) deps.add(destBase);
  }

  return allowed;
}

// fallow-ignore-next-line complexity
async function isExemptDep(workspaceRoot: string, npmPackageName: string): Promise<boolean> {
  try {
    const dir = await tryResolveWorkspacePackageDir(workspaceRoot, npmPackageName);
    if (dir === undefined) return false;
    const pkgJson = await readPackageJson(dir);
    const alistigo = pkgJson.alistigo;
    if (typeof alistigo !== "object" || alistigo === null) return false;
    const type = (alistigo as Record<string, unknown>).type;
    return type === "tool" || type === "plugin";
  } catch {
    return false;
  }
}

// fallow-ignore-next-line complexity
async function run(ctx: CheckContext): Promise<CheckResult> {
  const issues: CheckIssue[] = [];
  const nodes = getCheckableNodes(ctx.calmFile);
  const allowedMap = buildAllowedDepsMap(
    ctx.calmFile.nodes,
    ctx.calmFile.relationships,
    ctx.artifactName,
  );

  for (const node of nodes) {
    const impl = resolveImplPackage(node, ctx.artifactName);
    if (impl === undefined) continue;

    if (node["node-type"] === "skill") continue;

    const pkgDir = resolvePackageDir(ctx.workspaceRoot, impl);
    let pkgJson: Record<string, unknown>;
    try {
      pkgJson = await readPackageJson(pkgDir);
    } catch {
      continue; // module-existence check will catch missing packages
    }

    const allDeps: Record<string, string> = {
      ...((pkgJson.dependencies as Record<string, string> | undefined) ?? {}),
      ...((pkgJson.devDependencies as Record<string, string> | undefined) ?? {}),
      ...((pkgJson.peerDependencies as Record<string, string> | undefined) ?? {}),
    };

    const alistigoDeps = Object.keys(allDeps).filter((d) => d.startsWith("@alistigo/"));
    const allowed = allowedMap.get(impl) ?? new Set<string>();

    for (const dep of alistigoDeps) {
      if (allowed.has(dep)) continue;
      if (await isExemptDep(ctx.workspaceRoot, dep)) continue;
      issues.push({
        packageName: impl,
        message: `Declares forbidden dependency ${dep}`,
        fix: `Remove ${dep} from ${impl.replace(/^@[^/]+\//, "")}/package.json, or update the CALM relationships`,
        docsRef: `packages/architecture/docs/architecture.md#ddd-layers — source: ${ctx.calmFilePath}`,
      });
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
