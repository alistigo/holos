import type { AlistigoPlugin } from "@alistigo/artifact-plugin-api";
import { loadPlugin } from "@alistigo/artifact-plugin-api";
import { createLogger } from "@alistigo/logger";

const log = createLogger("alistigo:artifact-list:plugins");

// Injected at the front of every spec (claude = preferred, local = fallback).
// User-supplied plugins that share a key override the default config value.
const DEFAULT_STORAGE_PLUGINS: Record<string, Record<string, unknown>> = {
  "@alistigo/claude-storage-plugin": {},
  "@alistigo/local-storage-plugin": {},
};

/**
 * Merges default storage plugins into the front of `userSpec` so they always
 * load first. Keys already present in `userSpec` keep the user-supplied config.
 */
export function buildPluginSpec(
  userSpec?: Record<string, Record<string, unknown>>,
): Record<string, Record<string, unknown>> {
  const user = userSpec ?? {};
  const result: Record<string, Record<string, unknown>> = {};
  for (const [k, v] of Object.entries(DEFAULT_STORAGE_PLUGINS)) {
    if (!(k in user)) result[k] = v;
  }
  Object.assign(result, user);
  return result;
}

/**
 * Dynamically imports every plugin named in `spec`. A plugin that fails to load
 * (network error, missing CDN bundle, etc.) is logged and dropped — never thrown —
 * so one broken plugin can never prevent the host artifact from mounting.
 */
export async function loadPlugins(
  spec: Record<string, Record<string, unknown>> | undefined,
): Promise<AlistigoPlugin[]> {
  const entries = Object.entries(spec ?? {});
  if (entries.length === 0) return [];

  const loaded = await Promise.all(
    entries.map(async ([packageName]) => {
      try {
        return await loadPlugin(packageName);
      } catch (err) {
        log.error({ err, packageName }, "failed to load plugin");
        return undefined;
      }
    }),
  );

  return loaded.filter((plugin): plugin is AlistigoPlugin => plugin !== undefined);
}
