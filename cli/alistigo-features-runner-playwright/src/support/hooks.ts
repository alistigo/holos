import {
  After,
  AfterAll,
  AfterStep,
  Before,
  BeforeAll,
  type ITestCaseHookParameter,
} from "@cucumber/cucumber";
import { type Browser, chromium } from "playwright";
import type { AlistigoWorld } from "./world";

let browser: Browser | undefined;

/**
 * BeforeAll and AfterAll hooks to manage the Playwright browser instance across all scenarios.
 */
BeforeAll(async () => {
  browser = await chromium.launch({ headless: process.env.HEADED !== "1" });
});

AfterAll(async () => {
  if (browser) {
    await browser.close().catch(() => undefined);
  }
});

Before({ tags: "@todo" }, async function (this: AlistigoWorld) {
  return "skipped";
});

/**
 * Before hook to initialize the browser context and page for each scenario, and After hooks to handle cleanup.
 * Skipped for @todo scenarios via the tag expression so no browser context is created unnecessarily.
 */
Before({ tags: "not @todo" }, async function (this: AlistigoWorld) {
  if (!browser) {
    throw new Error("Browser instance is not available");
  }
  await this.beforeScenario(browser);
});

After(async function (this: AlistigoWorld) {
  await this.afterScenario();
});

AfterStep(async function (this: AlistigoWorld, scenario: ITestCaseHookParameter) {
  if (scenario.result?.status === "FAILED") {
    const screenshot = await this.page?.screenshot().catch(() => undefined);
    if (screenshot) {
      this.attach(screenshot, "image/png");
    }
  }
});
