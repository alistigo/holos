import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const FIXTURES: Record<string, string> = {
  "@alistigo/artifact-sentry-plugin": fileURLToPath(
    new URL("./fake-sentry-plugin.js", import.meta.url),
  ),
};

/** Source of the fake plugin bundle registered for `packageName`, read fresh each call. */
export function fakePluginSource(packageName: string): string {
  const path = FIXTURES[packageName];
  if (path === undefined) {
    throw new Error(`No fake plugin fixture registered for "${packageName}"`);
  }
  return readFileSync(path, "utf-8");
}
