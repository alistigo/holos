/**
 * Default storage plugin routes for the test environment.
 *
 * The artifact list's mount() injects @alistigo/local-storage-plugin and
 * @alistigo/claude-storage-plugin into the CDN spec automatically. In CI and
 * local test runs these packages are not yet published, so the CDN fetch fails
 * and mount() falls back to InMemoryListStore — which loses state on page
 * reload, breaking the persistence scenarios.
 *
 * We intercept those exact CDN URLs (via page.route()) and serve local
 * alternatives before each scenario, just like the monitoring plugin tests do
 * for their plugins.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Page } from "playwright";
import { installPluginRoute } from "./plugin-route.js";

const __dir = dirname(fileURLToPath(import.meta.url));

// Serve the actual built bundle so localStorage-backed persistence works.
const LOCAL_STORAGE_BUNDLE = readFileSync(
  resolve(__dir, "../../../../packages/alistigo-local-storage-plugin/dist/index.js"),
  "utf-8",
);

// Claude storage is unavailable in all test environments — return a stub that
// always reports isAvailable() === false so the runtime skips it cleanly.
const CLAUDE_STORAGE_STUB = `export default {
  name: "@alistigo/claude-storage-plugin",
  type: "storage",
  storage: {
    isAvailable: () => false,
    createStore() { throw new Error("Claude storage is not available in test environments"); },
    async listKeys() { return []; },
  },
};`;

export async function installDefaultStorageRoutes(page: Page): Promise<void> {
  await installPluginRoute(page, "@alistigo/local-storage-plugin", LOCAL_STORAGE_BUNDLE);
  await installPluginRoute(page, "@alistigo/claude-storage-plugin", CLAUDE_STORAGE_STUB);
}
