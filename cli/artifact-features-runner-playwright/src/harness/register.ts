/**
 * Side-effect module: registering the shared harness with Cucumber.
 *
 * The runner puts this FIRST in Cucumber's `import` list, ahead of the target
 * package's step definitions and support files. The order is part of the
 * contract — `setWorldConstructor` is last-call-wins, so the base World must be
 * registered before a features package can override it with a subclass.
 *
 * Importing `./index.js` registers nothing; registration is this module alone.
 */

import {
  After,
  AfterAll,
  AfterStep,
  Before,
  BeforeAll,
  type ITestCaseHookParameter,
  setDefaultTimeout,
  setWorldConstructor,
} from "@cucumber/cucumber";
import { type Browser, chromium } from "playwright";
import { ArtifactWorld } from "./world.js";

// Browser automation against real bundles needs more than cucumber's 5s default.
setDefaultTimeout(30_000);

let browser: Browser | undefined;

BeforeAll(async () => {
  // Set by the runner from the repo .env, its --chromium-executable flag, or
  // the shell, when this host cannot run playwright's bundled download.
  const executablePath = process.env.ARTIFACT_FEATURES_CHROMIUM_EXECUTABLE;
  browser = await chromium.launch({
    headless: process.env.HEADED !== "1",
    ...(executablePath === undefined || executablePath === "" ? {} : { executablePath }),
  });
});

AfterAll(async () => {
  if (browser) {
    await browser.close().catch(() => undefined);
  }
  browser = undefined;
});

/**
 * Not-yet-implemented scenarios are skipped before any browser context exists,
 * so they cost nothing and cannot fail.
 *
 * The `run` command additionally filters `@todo` out at the configuration level,
 * which means this hook does not fire on a normal run — Cucumber resolves step
 * definitions before hooks, so a `@todo` scenario with no step definitions would
 * report `undefined` and abort a failFast suite before any hook could skip it.
 * The hook is still part of the published harness contract: anything composing
 * its own Cucumber run from `/harness` without that filter gets the skip
 * behaviour, and it is the mechanism `run` would rely on if the filter is ever
 * dropped. `run` reports the excluded count so the scenarios stay visible.
 */
Before({ tags: "@todo" }, () => "skipped" as const);

Before({ tags: "not @todo" }, async function (this: ArtifactWorld) {
  if (!browser) {
    throw new Error("Browser instance is not available");
  }
  await this.beforeScenario(browser);
});

After(async function (this: ArtifactWorld) {
  await this.afterScenario();
});

AfterStep(async function (this: ArtifactWorld, scenario: ITestCaseHookParameter) {
  if (scenario.result?.status === "FAILED") {
    const screenshot = await this.page?.screenshot().catch(() => undefined);
    if (screenshot) {
      this.attach(screenshot, "image/png");
    }
  }
});

setWorldConstructor(ArtifactWorld);
