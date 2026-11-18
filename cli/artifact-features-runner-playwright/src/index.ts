/**
 * `@alistigo/artifact-features-runner-playwright` — library entry point.
 *
 * Exposes the runner's reusable, non-CLI surface: features-package resolution,
 * host validation, and the check result shape the doctor reports with.
 *
 * This module MUST NOT import `clipanion` or anything under `src/commands/`.
 * The CLI reaches the same code through `src/cli.ts`, which is the `bin`; keeping
 * the two apart means importing this package as a library never pulls argument
 * parsing into a test process.
 *
 * The shared Cucumber harness lives behind a separate subpath export,
 * `@alistigo/artifact-features-runner-playwright/harness`, so that importing it
 * does not drag playwright and cucumber into a consumer that only wants to
 * resolve a features package.
 */

export type { CheckResult, CheckStatus } from "./lib/check.js";
export { CHECK_ICONS, check } from "./lib/check.js";
export type { FeaturesPackage, LoadOutcome } from "./lib/features-package.js";
export { loadFeaturesPackage } from "./lib/features-package.js";
export { validateHost } from "./lib/playground.js";
