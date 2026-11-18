/**
 * The Cucumber World every features package shares.
 *
 * It owns the per-scenario browser objects and the playground interactions that
 * do not depend on any domain. A features package subclasses it to add domain
 * state and a domain page object; it never re-declares the lifecycle.
 *
 * The domain half deliberately stays out: `list-features`' `setDocument` is
 * typed to `@alistigo/list-document`, so the generic affordance here is
 * `seedStorage`, which that package wraps.
 */

import { type IWorldOptions, World } from "@cucumber/cucumber";
import type { Browser, BrowserContext, Page } from "playwright";
import { PlaygroundPage } from "./playground.page.js";
import { installDefaultRoutes } from "./routes.js";

/** Set by the runner from `--host`. */
const BASE_URL_ENV = "PLAYWRIGHT_BASE_URL";
/** Legacy alias, still honoured. */
const APP_URL_ENV = "ALISTIGO_APP_URL";
/** Set by the runner from `--artifact`. */
export const ARTIFACT_ENV = "ARTIFACT_FEATURES_ARTIFACT";

const DEFAULT_BASE_URL = "http://localhost:4173";

export class ArtifactWorld extends World {
  readonly baseUrl: string;
  /** Which artifact to select in the playground; undefined uses its default. */
  readonly artifact: string | undefined;

  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  playgroundPage!: PlaygroundPage;

  /** Uncaught page-level errors, collected via the page's "pageerror" event. */
  pageErrors: string[] = [];

  constructor(opts: IWorldOptions) {
    super(opts);
    this.baseUrl = process.env[BASE_URL_ENV] ?? process.env[APP_URL_ENV] ?? DEFAULT_BASE_URL;
    const artifact = process.env[ARTIFACT_ENV];
    this.artifact = artifact === undefined || artifact === "" ? undefined : artifact;
  }

  /**
   * Subclasses that override this MUST call `super.beforeScenario(browser)`
   * first — routes have to be installed before the first navigation, or they
   * miss the fetch they were meant to intercept.
   */
  async beforeScenario(browser: Browser): Promise<void> {
    if (this.browser && this.browser !== browser) {
      throw new Error("Browser instance already initialized with a different instance.");
    }
    this.browser = browser;
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
    this.page.on("pageerror", (err) => this.pageErrors.push(err.message));
    await installDefaultRoutes(this.page);
    this.playgroundPage = this.createPlaygroundPage();
    await this.playgroundPage.open();
  }

  /**
   * Override to supply a domain page object. Called after the page exists and
   * the routes are installed, before the playground is opened.
   */
  protected createPlaygroundPage(): PlaygroundPage {
    return new PlaygroundPage(this.baseUrl, this.page, this.artifact);
  }

  async afterScenario(): Promise<void> {
    await this.page?.close().catch(() => undefined);
    await this.context?.close().catch(() => undefined);
  }

  /**
   * Seeds the preview origin's localStorage and reloads so the artifact picks
   * it up. The generic form of "start this scenario from a known state"; a
   * domain package wraps it with its own document type.
   *
   * Reloads through `reloadArtifact`, never `page.reload()` — see why there.
   */
  async seedStorage(entries: Record<string, string>): Promise<void> {
    if (!this.playgroundPage) return;
    await this.page.evaluate((payload) => {
      localStorage.clear();
      for (const [key, value] of Object.entries(payload)) {
        localStorage.setItem(key, value);
      }
    }, entries);
    await this.reloadArtifact();
  }

  /**
   * Reloads the artifact; localStorage survives, so persisted state is reread.
   *
   * Delegates to `PlaygroundPage.reload()` rather than driving `page.reload()`
   * here, because the reload has to be followed by re-selecting the artifact.
   * The playground keeps the chosen artifact in React state only — no URL
   * parameter, no storage — so a bare page reload drops the selection back to
   * the registry's first entry. And since every artifact exposes the same
   * `alistigo-app` readiness marker, waiting for readiness afterwards resolves
   * happily against the *wrong* artifact, and the scenario then runs against it
   * reporting nothing amiss. The draw-comments suite's "Reloading the artifact
   * discards an in-progress annotation" scenario is the regression guard.
   */
  async reloadArtifact(): Promise<void> {
    await this.playgroundPage.reload();
  }

  async enablePlugin(packageName: string): Promise<void> {
    await this.playgroundPage.enablePlugin(packageName);
  }
}
