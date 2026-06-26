import type { AlistigoDocument } from "@alistigo/document-format";
import { type IWorldOptions, setWorldConstructor, World } from "@cucumber/cucumber";
import type { Browser, BrowserContext, Page } from "playwright";
import { ApplicationPage } from "../pages/application.page";
import { buildEmptyDocument } from "./document";
import { installDocumentRoute } from "./document-injection";

export class AlistigoWorld extends World {
  readonly baseUrl: string;

  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  applicationPage!: ApplicationPage;

  private document: AlistigoDocument = buildEmptyDocument();

  constructor(opts: IWorldOptions) {
    super(opts);
    this.baseUrl = process.env.ALISTIGO_APP_URL ?? "http://localhost:5173/iframe.html";
  }

  // fallow-ignore-next-line unused-class-member
  async beforeScenario(browser: Browser): Promise<void> {
    if (this.browser && this.browser !== browser) {
      throw new Error("Browser instance already initialized with a different instance.");
    }
    this.browser = browser;
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
    this.applicationPage = new ApplicationPage(this.baseUrl, this.page);
    await installDocumentRoute(this.page, this.baseUrl, () => this.document);
    await this.applicationPage.open();
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
      // Clear localStorage so the new fixture always seeds fresh (not blocked by
      // any state left from the initial beforeScenario open or a previous step).
      await this.page.evaluate(() => localStorage.clear());
      await this.applicationPage.reload();
    }
  }
}

setWorldConstructor(AlistigoWorld);
