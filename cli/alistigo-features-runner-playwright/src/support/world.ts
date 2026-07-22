import type { AlistigoDocument } from "@alistigo/document-format";
import { type IWorldOptions, setWorldConstructor, World } from "@cucumber/cucumber";
import type { Browser, BrowserContext, Page } from "playwright";
import { ApplicationPage } from "../pages/application.page";
import { buildEmptyDocument } from "./document";
import { fakePluginSource } from "./fixtures/index.js";
import { installPluginRoute } from "./plugin-route";

export class AlistigoWorld extends World {
  readonly baseUrl: string;

  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  applicationPage!: ApplicationPage;

  /** Uncaught page-level errors, collected via the page's "pageerror" event. */
  pageErrors: string[] = [];

  private document: AlistigoDocument = buildEmptyDocument();
  private pluginPackageName: string | undefined;
  private pluginConfig: Record<string, unknown> | undefined;

  constructor(opts: IWorldOptions) {
    super(opts);
    this.baseUrl = process.env.ALISTIGO_APP_URL ?? "http://localhost:5173";
  }

  // fallow-ignore-next-line unused-class-member
  async beforeScenario(browser: Browser): Promise<void> {
    if (this.browser && this.browser !== browser) {
      throw new Error("Browser instance already initialized with a different instance.");
    }
    this.browser = browser;
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
    this.page.on("pageerror", (err) => this.pageErrors.push(err.message));
    this.applicationPage = new ApplicationPage(this.baseUrl, this.page);
    await this.applicationPage.open();
  }

  /**
   * Installs the fake bundle route for `packageName` under test. Must run
   * before any navigation that triggers the plugin loader's fetch (every
   * scenario's "Given the ... plugin" step runs first, guaranteeing this).
   */
  // fallow-ignore-next-line unused-class-member
  async setPluginUnderTest(packageName: string): Promise<void> {
    this.pluginPackageName = packageName;
    await installPluginRoute(this.page, packageName, fakePluginSource(packageName));
  }

  // fallow-ignore-next-line unused-class-member
  setPluginConfig(config: Record<string, unknown>): void {
    this.pluginConfig = config;
  }

  /** Enables the plugin under test via the playground's checkbox. */
  // fallow-ignore-next-line unused-class-member
  async initializeArtifactWithPlugin(): Promise<void> {
    if (!this.pluginPackageName) {
      throw new Error("No plugin under test — call setPluginUnderTest first");
    }
    await this.page.getByRole("checkbox", { name: this.pluginPackageName }).check();
    await this.applicationPage.waitForArtifactReady();
  }

  // fallow-ignore-next-line unused-class-member
  async afterScenario(): Promise<void> {
    await this.page?.close().catch(() => undefined);
    await this.context?.close().catch(() => undefined);
  }

  // fallow-ignore-next-line unused-class-member
  async setDocument(document: AlistigoDocument): Promise<void> {
    this.document = document;

    if (this.applicationPage) {
      await this.page.evaluate(() => localStorage.clear());
      await this.page.getByLabel("Document").selectOption("__raw__");
      await this.page
        .getByRole("textbox", { name: /document json/i })
        .fill(JSON.stringify(document));
      await this.applicationPage.waitForArtifactReady();
    }
  }
}

setWorldConstructor(AlistigoWorld);
