/**
 * `@alistigo/artifact-features-runner-playwright/harness`
 *
 * The browser harness every features package shares: the Cucumber World, the
 * playground page object, the platform DOM contract, and the request
 * interception that keeps runs offline.
 *
 * Importing this module registers NOTHING with Cucumber. The runner separately
 * imports `./register.js`, whose side effects install the hooks and the default
 * World — see that file for why the order matters.
 *
 * What a features package still owns: its `.feature` files, its step
 * definitions, its domain locators and its domain fixtures. See
 * `contracts/features-package.md` in the feature spec for the full division.
 */

export { PlaygroundPage } from "./playground.page.js";
export {
  installBundleRoute,
  installDefaultRoutes,
  localBundleFor,
  parseJsdelivrUrl,
} from "./routes.js";
export { PLATFORM_TEST_IDS, PREVIEW_IFRAME_NAME, PREVIEW_IFRAME_TITLE } from "./test-ids.js";
export { ARTIFACT_ENV, ArtifactWorld } from "./world.js";
