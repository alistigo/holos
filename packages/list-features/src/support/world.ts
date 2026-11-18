import {
  ArtifactWorld,
  installBundleRoute,
  type PlaygroundPage,
} from "@alistigo/artifact-features-runner-playwright/harness";
import type { AlistigoDocument } from "@alistigo/list-document";
import { setWorldConstructor } from "@cucumber/cucumber";
import type { Browser } from "playwright";
import { ListApplicationPage } from "../pages/list-application.page.js";
import { fakePluginSource } from "./fixtures/index.js";

/**
 * The list domain's World.
 *
 * Everything generic — the browser, the context and page, route interception,
 * opening the playground, screenshots on failure — belongs to `ArtifactWorld`
 * in the runner's harness. What is left here is list-specific: seeding an
 * Alistigo list document, and the plugin-under-test fixtures the plugin
 * scenarios need.
 */
export class ListWorld extends ArtifactWorld {
  /** Narrowed to the list page object; the base class creates it via the hook below. */
  declare playgroundPage: ListApplicationPage;

  private pluginPackageName: string | undefined;
  private pluginConfig: Record<string, unknown> | undefined;

  protected override createPlaygroundPage(): PlaygroundPage {
    return new ListApplicationPage(this.baseUrl, this.page, this.artifact);
  }

  /** Convenience alias kept for the step definitions' existing vocabulary. */
  get applicationPage(): ListApplicationPage {
    return this.playgroundPage;
  }

  override async beforeScenario(browser: Browser): Promise<void> {
    // Routes must be installed before the first navigation, which the base
    // class performs — so super goes first, always.
    await super.beforeScenario(browser);
  }

  /** Seeds a list document and reloads so the artifact reprojects from it. */
  async setDocument(document: AlistigoDocument): Promise<void> {
    await this.seedStorage({ document: JSON.stringify(document) });
  }

  /**
   * Installs the fake bundle route for `packageName` under test. Must run
   * before any navigation that triggers the plugin loader's fetch (every
   * scenario's "Given the ... plugin" step runs first, guaranteeing this).
   */
  async setPluginUnderTest(packageName: string): Promise<void> {
    this.pluginPackageName = packageName;
    await installBundleRoute(this.page, packageName, fakePluginSource(packageName));
  }

  setPluginConfig(config: Record<string, unknown>): void {
    this.pluginConfig = config;
  }

  /** Enables the plugin under test via the playground's checkbox, optionally filling config. */
  async initializeArtifactWithPlugin(): Promise<void> {
    if (!this.pluginPackageName) {
      throw new Error("No plugin under test — call setPluginUnderTest first");
    }
    await this.playgroundPage.enablePlugin(this.pluginPackageName);

    if (this.pluginConfig && Object.keys(this.pluginConfig).length > 0) {
      await this.playgroundPage.fillPluginConfig(
        this.pluginPackageName,
        JSON.stringify(this.pluginConfig),
      );
      await this.playgroundPage.waitForArtifactReady();
    }
  }
}

setWorldConstructor(ListWorld);
