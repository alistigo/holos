import type { AlistigoPlugin } from "./types.js";

/**
 * Pre-1.0 versioning convention (ADR 0011): resolve plugins to the jsDelivr major-
 * version-pinned URL, same as @alistigo/artifact-manager resolves artifact CDN URLs.
 * No per-plugin override in this round — always pinned to major version 0.
 */
const JSDELIVR_MAJOR_VERSION = 0;

export function resolvePluginUrl(packageName: string): string {
  return `https://cdn.jsdelivr.net/npm/${packageName}@${JSDELIVR_MAJOR_VERSION}/dist/index.js`;
}

/**
 * Dynamically imports a plugin package's self-contained ESM bundle from jsDelivr.
 * The bundle must have zero bare-specifier imports (see each plugin package's own
 * vite.config.ts) since a browser cannot resolve those without an import map.
 */
export async function loadPlugin(packageName: string): Promise<AlistigoPlugin> {
  const url = resolvePluginUrl(packageName);
  const mod = (await import(/* @vite-ignore */ url)) as { default: AlistigoPlugin };
  return mod.default;
}
