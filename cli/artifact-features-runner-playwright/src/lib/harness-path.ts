/**
 * Where the compiled harness registration module lives, as an absolute path.
 *
 * The runner hands this to Cucumber so the shared hooks and the base World are
 * registered for every features package, including one that exports no support
 * directory of its own.
 *
 * Node keys its ESM cache on the resolved file URL and follows symlinks, so a
 * features package importing `@alistigo/artifact-features-runner-playwright/harness`
 * through its pnpm link resolves to the same realpath as this absolute path and
 * therefore the same module instance. If that ever stops holding, the symptom is
 * two browser launches per run, and the fix is to hand Cucumber the same bare
 * specifier instead of this path.
 */

import path from "node:path";

export function harnessRegistrationModule(): string {
  return path.join(import.meta.dirname, "..", "harness", "register.js");
}
