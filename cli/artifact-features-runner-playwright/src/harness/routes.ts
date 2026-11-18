/**
 * Request interception that keeps a features run offline and deterministic.
 *
 * The playground's preview iframe loads three kinds of code over the network:
 *
 *  1. The artifact bundle itself. A `vite preview` build is not a dev build, so
 *     the playground's `resolveScriptUrl` falls through to the registry's
 *     jsDelivr URL — meaning an un-intercepted run tests the *published*
 *     artifact, not the working tree. Every source change made for a feature
 *     would be invisible.
 *  2. Plugin bundles, resolved the same way (or through the dev server's
 *     `/@fs/` overrides when the playground runs in dev mode).
 * Both are served from the workspace instead, so a run needs no network.
 *
 * `html-to-image` used to be a third case and the one hole in that promise: the
 * playground loaded it from cdnjs under a Subresource Integrity hash for the
 * minified build, which the unminified file on npm cannot satisfy, so no local
 * substitute survived the browser's SRI check. The playground now serves it
 * from its own origin instead, which closes the hole at the source and needs no
 * interception here. Resolution is by package
 * name through node's own resolver, never by a relative path reaching out of
 * this package — a `../../packages/...` read is both fragile and a
 * `no-cross-package-relative-import` violation.
 *
 * A package with no local build falls through to the network rather than
 * failing: diagnosing a missing build is `doctor`'s job, not a route handler's.
 */

import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import type { Page, Route } from "playwright";

const JSDELIVR_ALISTIGO = "https://cdn.jsdelivr.net/npm/@alistigo/**";

/**
 * Claude storage is unavailable in every test environment. Serve a stub that
 * reports so cleanly, rather than letting the real plugin fail to load and the
 * runtime fall back to an in-memory store that loses state across reloads.
 */
const CLAUDE_STORAGE_STUB = `export default {
  name: "@alistigo/claude-storage-plugin",
  type: "storage",
  storage: {
    isAvailable: () => false,
    createStore() { throw new Error("Claude storage is not available in test environments"); },
    async listKeys() { return []; },
  },
};`;

const JS_HEADERS = {
  // A dynamic import() of a cross-origin module fetches in CORS mode, and there
  // is no real upstream response here to inherit the header from.
  "access-control-allow-origin": "*",
} as const;

async function fulfillJs(route: Route, body: string): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: "application/javascript; charset=utf-8",
    headers: { ...JS_HEADERS },
    body,
  });
}

/** `@alistigo/artifact-list` -> `artifact-list`. */
function unscoped(packageName: string): string {
  return packageName.replace(/^@[^/]+\//, "");
}

/**
 * Recovers the package name from a jsDelivr URL, dropping any version pin.
 * `https://cdn.jsdelivr.net/npm/@alistigo/artifact-list@0/dist/index.js`
 *   -> `{ packageName: "@alistigo/artifact-list", file: "dist/index.js" }`
 */
export function parseJsdelivrUrl(url: string): { packageName: string; file: string } | undefined {
  const match = /\/npm\/(@[^/]+\/[^/@]+)(?:@[^/]*)?\/(.+)$/.exec(url);
  if (match === null) return undefined;
  const [, packageName, file] = match;
  if (packageName === undefined || file === undefined) return undefined;
  return { packageName, file: file.split("?")[0] ?? file };
}

/** Directories `pnpm-workspace.yaml` globs in this repo. */
const WORKSPACE_DIRS = ["packages", "apps", "cli", "websites"];

/** Walks up from `from` looking for the pnpm workspace root. */
function findWorkspaceRoot(from: string): string | undefined {
  let dir = path.resolve(from);
  for (;;) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

function packageNameAt(dir: string): string | undefined {
  try {
    const parsed: unknown = JSON.parse(readFileSync(path.join(dir, "package.json"), "utf-8"));
    const name = (parsed as { name?: unknown }).name;
    return typeof name === "string" ? name : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Locates a package's directory.
 *
 * The workspace layout is tried first, because a workspace package is NOT
 * present in its own `node_modules` — and the cwd during a features run is the
 * artifact package whose bundle we are asked to serve, which is exactly that
 * case. The repo convention is that a package's directory name equals its
 * unscoped npm name, and the `name` field is verified rather than assumed.
 *
 * Node resolution and a `node_modules` walk follow, for third-party packages
 * and for any workspace package that does not follow the layout.
 */
function resolvePackageRoot(packageName: string, from: string): string | undefined {
  const workspaceRoot = findWorkspaceRoot(from);
  if (workspaceRoot !== undefined) {
    for (const parent of WORKSPACE_DIRS) {
      const candidate = path.join(workspaceRoot, parent, unscoped(packageName));
      if (packageNameAt(candidate) === packageName) return candidate;
    }
  }

  const require = createRequire(path.join(from, "noop.js"));
  try {
    return path.dirname(require.resolve(`${packageName}/package.json`));
  } catch {
    // An exports map can block the package.json subpath; walk node_modules.
  }
  let dir = path.resolve(from);
  for (;;) {
    const candidate = path.join(dir, "node_modules", ...packageName.split("/"));
    if (existsSync(path.join(candidate, "package.json"))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

/**
 * The local build that should stand in for a jsDelivr request, or undefined
 * when the package has not been built in this workspace.
 */
export function localBundleFor(
  packageName: string,
  requestedFile: string,
  from: string = process.cwd(),
): string | undefined {
  const root = resolvePackageRoot(packageName, from);
  if (root === undefined) return undefined;
  const candidates = [requestedFile, "dist/index.umd.js", "dist/index.js", "dist/index.mjs"];
  for (const candidate of candidates) {
    const file = path.join(root, candidate);
    if (existsSync(file)) return file;
  }
  return undefined;
}

/** Serves `jsSource` for every URL a plugin or artifact bundle could be fetched from. */
export async function installBundleRoute(
  page: Page,
  packageName: string,
  jsSource: string,
): Promise<void> {
  const handler = (route: Route) => fulfillJs(route, jsSource);
  // Dev-server override: plugins are pointed at /@fs/<abs-path>/src/index.ts.
  await page.route(`**/${unscoped(packageName)}/src/**`, handler);
  await page.route(`**/npm/${packageName}*/**`, handler);
}

/**
 * Serves local builds for every `@alistigo/*` bundle the preview requests, plus
 * the Claude storage stub and html-to-image. Must be installed before the first
 * navigation — a route added afterwards misses the fetch it was meant to catch.
 */
export async function installDefaultRoutes(
  page: Page,
  from: string = process.cwd(),
): Promise<void> {
  await page.route(JSDELIVR_ALISTIGO, async (route) => {
    const parsed = parseJsdelivrUrl(route.request().url());
    if (parsed === undefined) {
      await route.fallback();
      return;
    }
    if (parsed.packageName === "@alistigo/claude-storage-plugin") {
      await fulfillJs(route, CLAUDE_STORAGE_STUB);
      return;
    }
    const local = localBundleFor(parsed.packageName, parsed.file, from);
    if (local === undefined) {
      // No local build: let it reach the network rather than failing here.
      await route.fallback();
      return;
    }
    await fulfillJs(route, readFileSync(local, "utf-8"));
  });

  // The dev playground points plugins at /@fs/ source paths instead of jsDelivr.
  await page.route("**/claude-storage-plugin/src/**", (route) =>
    fulfillJs(route, CLAUDE_STORAGE_STUB),
  );

  // `html-to-image` needs no route: the playground serves it from its own
  // origin (see buildIframeSrcdoc.ts), so it never leaves the machine.
}
