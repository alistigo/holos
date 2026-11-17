import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export interface FeaturesPackage {
  /** npm name, as passed to --target. */
  name: string;
  /** Directory the package resolved to (a symlink into the workspace, under pnpm). */
  root: string;
  domain: string | undefined;
  featuresDir: string;
  stepDefinitionsDir: string;
  supportDir: string | undefined;
  featureFiles: string[];
}

export type LoadOutcome =
  | { ok: true; pkg: FeaturesPackage }
  | { ok: false; detail: string; fix: string[] };

interface ConditionalExports {
  [condition: string]: string | ConditionalExports | undefined;
}

interface TargetPackageJson {
  name?: string;
  main?: string;
  exports?: string | ConditionalExports;
  alistigo?: { type?: string; domain?: string };
}

interface FeaturesExports {
  FEATURES_DIR?: unknown;
  STEP_DEFINITIONS_DIR?: unknown;
  SUPPORT_DIR?: unknown;
}

const ENTRY_CONDITIONS = ["import", "module", "node", "default"];

/**
 * Walks `node_modules` up from `from` rather than using `createRequire`: features
 * packages ship ESM-only `exports` maps, so both the `<name>/package.json` subpath
 * and the CJS resolution of `<name>` are blocked by the exports map.
 */
function findPackageRoot(name: string, from: string): string | undefined {
  let dir = path.resolve(from);
  for (;;) {
    const candidate = path.join(dir, "node_modules", ...name.split("/"));
    if (existsSync(path.join(candidate, "package.json"))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

// fallow-ignore-next-line complexity
function entryFromExports(value: string | ConditionalExports | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (value === undefined) return undefined;
  for (const condition of ENTRY_CONDITIONS) {
    const resolved = entryFromExports(value[condition]);
    if (resolved !== undefined) return resolved;
  }
  return undefined;
}

function resolveEntry(pkgJson: TargetPackageJson): string | undefined {
  const { exports: exportsMap } = pkgJson;
  if (typeof exportsMap === "string") return exportsMap;
  return entryFromExports(exportsMap?.["."]) ?? pkgJson.main;
}

function unresolved(name: string, from: string): LoadOutcome {
  return {
    ok: false,
    detail: `cannot resolve "${name}" from ${from}`,
    fix: [
      `Add "${name}": "workspace:*" to the devDependencies of the package whose`,
      "test:e2e target invokes this runner, then run `pnpm install`.",
      "The target is resolved from the current working directory, so the consumer",
      "owns the dependency edge and this runner stays domain-agnostic.",
    ],
  };
}

function readFeatureFiles(featuresDir: string): string[] | undefined {
  try {
    return readdirSync(featuresDir, { recursive: true })
      .map(String)
      .filter((f) => f.endsWith(".feature"));
  } catch {
    return undefined;
  }
}

// fallow-ignore-next-line complexity
export async function loadFeaturesPackage(name: string, from: string): Promise<LoadOutcome> {
  const root = findPackageRoot(name, from);
  if (root === undefined) return unresolved(name, from);

  let pkgJson: TargetPackageJson;
  try {
    pkgJson = JSON.parse(
      readFileSync(path.join(root, "package.json"), "utf8"),
    ) as TargetPackageJson;
  } catch (err) {
    return { ok: false, detail: `unreadable package.json in ${root}: ${String(err)}`, fix: [] };
  }

  const alistigoType = pkgJson.alistigo?.type;
  if (alistigoType !== "features") {
    return {
      ok: false,
      detail: `"${name}" is not a features package (alistigo.type is "${alistigoType ?? "undefined"}")`,
      fix: [`Add "alistigo": { "type": "features", "domain": "<domain>" } to its package.json.`],
    };
  }

  const entry = resolveEntry(pkgJson);
  if (entry === undefined) {
    return {
      ok: false,
      detail: `"${name}" declares no entry point`,
      fix: [`Add an "exports" map or "main" field to its package.json.`],
    };
  }

  let exported: FeaturesExports;
  try {
    exported = (await import(pathToFileURL(path.resolve(root, entry)).href)) as FeaturesExports;
  } catch (err) {
    return {
      ok: false,
      detail: `failed to import "${name}": ${String(err)}`,
      fix: ["Build the features package first (`nx run <project>:build`)."],
    };
  }

  const { FEATURES_DIR, STEP_DEFINITIONS_DIR, SUPPORT_DIR } = exported;
  if (typeof FEATURES_DIR !== "string" || typeof STEP_DEFINITIONS_DIR !== "string") {
    return {
      ok: false,
      detail: `"${name}" does not export FEATURES_DIR and STEP_DEFINITIONS_DIR`,
      fix: ["Export both as absolute paths from the package entry point."],
    };
  }

  const featureFiles = readFeatureFiles(FEATURES_DIR);
  if (featureFiles === undefined) {
    return {
      ok: false,
      detail: `FEATURES_DIR "${FEATURES_DIR}" is not readable`,
      fix: ["Build the features package first (`nx run <project>:build`)."],
    };
  }
  if (featureFiles.length === 0) {
    return {
      ok: false,
      detail: `no .feature files under "${FEATURES_DIR}"`,
      fix: ["Check that the build copies features/ into dist/."],
    };
  }

  return {
    ok: true,
    pkg: {
      name,
      root,
      domain: pkgJson.alistigo?.domain,
      featuresDir: FEATURES_DIR,
      stepDefinitionsDir: STEP_DEFINITIONS_DIR,
      supportDir: typeof SUPPORT_DIR === "string" ? SUPPORT_DIR : undefined,
      featureFiles,
    },
  };
}
