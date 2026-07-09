import type { AlistigoPlugin } from "@alistigo/artifact-plugin-api";
import { loadPlugin } from "@alistigo/artifact-plugin-api";
import { createLogger } from "@alistigo/logger";

const log = createLogger("alistigo:artifact-list:plugins");

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
