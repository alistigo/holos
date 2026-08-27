import type { AlistigoDocument } from "@alistigo/list";
import { type IWorldOptions, setWorldConstructor, World } from "@cucumber/cucumber";
import type { Browser, BrowserContext, Page } from "playwright";
import { ApplicationPage } from "../pages/application.page";
import { fakePluginSource } from "./fixtures/index.js";
import { installPluginRoute } from "./plugin-route";
import { installDefaultStorageRoutes } from "./storage-routes.js";

export class AlistigoWorld extends World {
  readonly baseUrl: string;

  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  applicationPage!: ApplicationPage;

  /** Uncaught page-level errors, collected via the page's "pageerror" event. */
  pageErrors: string[] = [];

  private pluginPackageName: string | undefined;
  private pluginConfig: Record<string, unknown> | undefined;

  constructor(opts: IWorldOptions) {
    super(opts);
    this.baseUrl = process.env.ALISTIGO_APP_URL ?? "http://localhost:5173";
  }

  async beforeScenario(browser: Browser): Promise<void> {
    if (this.browser && this.browser !== browser) {
      throw new Error("Browser instance already initialized with a different instance.");
    }
    this.browser = browser;
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
    this.page.on("pageerror", (err) => this.pageErrors.push(err.message));
    await installDefaultStorageRoutes(this.page);
    this.applicationPage = new ApplicationPage(this.baseUrl, this.page);
    await this.applicationPage.open();
  }

  /**
   * Installs the fake bundle route for `packageName` under test. Must run
   * before any navigation that triggers the plugin loader's fetch (every
   * scenario's "Given the ... plugin" step runs first, guaranteeing this).
   */
  async setPluginUnderTest(packageName: string): Promise<void> {
    this.pluginPackageName = packageName;
    await installPluginRoute(this.page, packageName, fakePluginSource(packageName));
  }

  setPluginConfig(config: Record<string, unknown>): void {
    this.pluginConfig = config;
  }

  /** Enables the plugin under test via the playground's checkbox, optionally filling config. */
  async initializeArtifactWithPlugin(): Promise<void> {
    if (!this.pluginPackageName) {
      throw new Error("No plugin under test — call setPluginUnderTest first");
    }
    const checkboxNav = this.page.waitForEvent("framenavigated", {
      predicate: (frame) => frame.name() === "artifact-preview",
      timeout: 5000,
    });
    await this.page.getByRole("checkbox", { name: this.pluginPackageName }).check();
    await checkboxNav;

    if (this.pluginConfig && Object.keys(this.pluginConfig).length > 0) {
      const configNav = this.page.waitForEvent("framenavigated", {
        predicate: (frame) => frame.name() === "artifact-preview",
        timeout: 5000,
      });
      await this.page
        .getByRole("textbox", { name: `Config for ${this.pluginPackageName}` })
        .fill(JSON.stringify(this.pluginConfig));
      await configNav;
    }

    await this.applicationPage.waitForArtifactReady();
  }

  async afterScenario(): Promise<void> {
    await this.page?.close().catch(() => undefined);
    await this.context?.close().catch(() => undefined);
  }

  async setDocument(document: AlistigoDocument): Promise<void> {
    if (!this.applicationPage) return;
    const serialized = JSON.stringify(document);
    await this.page.evaluate((docJson) => {
      localStorage.clear();
      localStorage.setItem("document", docJson);
    }, serialized);
    await this.page.reload();
    await this.applicationPage.waitForArtifactReady();
  }

  async reloadArtifact(): Promise<void> {
    // localStorage retains state (list document, user identity) — artifact reads on reload
    await this.page.reload();
    await this.applicationPage.waitForArtifactReady();
  }

  /** Enables a plugin via the playground checkbox and waits for the iframe to reload. */
  async enablePlugin(packageName: string): Promise<void> {
    const checkboxNav = this.page.waitForEvent("framenavigated", {
      predicate: (frame) => frame.name() === "artifact-preview",
      timeout: 5000,
    });
    await this.page.getByRole("checkbox", { name: packageName }).check();
    await checkboxNav;
    await this.applicationPage.waitForArtifactReady();
  }
}

setWorldConstructor(AlistigoWorld);
