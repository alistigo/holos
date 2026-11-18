/**
 * The playground operations that are identical for every artifact.
 *
 * This class knows about the playground's chrome — the artifact selector, the
 * preview iframe, the plugin checkboxes — and nothing about any domain. A
 * features package that needs domain interactions subclasses it; a locator
 * naming a list row or a draw-comment button does not belong here.
 */

import type { Frame, FrameLocator, Page } from "playwright";
import { PLATFORM_TEST_IDS, PREVIEW_IFRAME_NAME, PREVIEW_IFRAME_TITLE } from "./test-ids.js";

/** How long to wait for the preview iframe to renavigate after a selection change. */
const FRAME_NAV_TIMEOUT = 5_000;

/** How long to wait for the preview to report the artifact we selected. */
const PREVIEW_APP_TIMEOUT = 20_000;

export class PlaygroundPage {
  readonly baseUrl: string;
  readonly page: Page;
  /** The artifact to select on open; undefined means "use the playground's default". */
  readonly artifact: string | undefined;

  constructor(baseUrl: string, page: Page, artifact?: string) {
    this.baseUrl = baseUrl;
    this.page = page;
    this.artifact = artifact;
  }

  /** The artifact's own DOM, inside the preview iframe. */
  get artifactFrame(): FrameLocator {
    return this.page.frameLocator(`iframe[title="${PREVIEW_IFRAME_TITLE}"]`);
  }

  /** The same frame as an object, for `evaluate` and `waitForFunction`. */
  get previewFrame(): Frame | null {
    return this.page.frame(PREVIEW_IFRAME_NAME);
  }

  /** Resolves once the preview iframe has navigated — e.g. after a config change. */
  private waitForPreviewNavigation(): Promise<unknown> {
    return this.page.waitForEvent("framenavigated", {
      predicate: (frame) => frame.name() === PREVIEW_IFRAME_NAME,
      timeout: FRAME_NAV_TIMEOUT,
    });
  }

  /** The artifact the preview iframe currently reports, from its injected config. */
  private async previewApp(): Promise<string | undefined> {
    const text = await this.artifactFrame
      .locator("#alistigo-config")
      .textContent({ timeout: 2_000 })
      .catch(() => null);
    if (text === null) return undefined;
    try {
      return (JSON.parse(text) as { app?: string }).app;
    } catch {
      return undefined;
    }
  }

  /**
   * Polls the preview's injected config until it reports `expected`.
   *
   * Waiting on a `framenavigated` event alone is not enough: every artifact
   * exposes the same readiness marker, so if the event we caught was the
   * iframe's *initial* navigation rather than the one our selection triggered,
   * `waitForArtifactReady` happily matches the artifact that was already there
   * and the scenario runs against the wrong one. Asking the iframe which app it
   * holds is the only check that cannot be satisfied by the previous artifact.
   */
  private async waitForPreviewApp(expected: string): Promise<void> {
    const deadline = Date.now() + PREVIEW_APP_TIMEOUT;
    let seen: string | undefined;
    while (Date.now() < deadline) {
      seen = await this.previewApp();
      if (seen === expected) return;
      await this.page.waitForTimeout(100);
    }
    throw new Error(
      `the preview iframe reports app "${seen ?? "(none)"}", expected "${expected}" — ` +
        "the selection did not reach the artifact iframe.",
    );
  }

  async open(): Promise<void> {
    await this.page.goto(this.baseUrl);
    if (this.artifact !== undefined) {
      await this.selectArtifact(this.artifact);
    }
    await this.waitForArtifactReady();
  }

  /**
   * Selects an artifact in the playground's `Artifact` combobox and waits for
   * the preview to reload with it. Fails naming what the playground does offer,
   * so a typo or an unregistered artifact reports a cause instead of a timeout.
   */
  async selectArtifact(name: string): Promise<void> {
    const selector = this.page.getByRole("combobox", { name: "Artifact" });
    await selector.waitFor({ state: "visible" });

    // Read the option values through locators rather than `evaluateAll`: this
    // package has no DOM lib, and the callback would run in the browser anyway.
    const options = await selector.locator("option").all();
    const attributes = await Promise.all(options.map((option) => option.getAttribute("value")));
    const values = attributes.filter((value): value is string => value !== null);
    if (!values.includes(name)) {
      throw new Error(
        `The playground does not offer "${name}". Offered: ${values.join(", ") || "(none)"}. ` +
          "Register it in packages/artifact-manager/src/registry.ts.",
      );
    }
    if ((await selector.inputValue()) === name) return;

    await selector.selectOption(name);
    await this.waitForPreviewApp(name);
  }

  /**
   * The single readiness contract: the artifact's mounted root carries
   * `data-testid="alistigo-app"`. Every artifact and widget exposes it.
   */
  async waitForArtifactReady(): Promise<void> {
    await this.artifactFrame.getByTestId(PLATFORM_TEST_IDS.app).waitFor({ state: "visible" });
  }

  async reload(): Promise<void> {
    await this.page.reload();
    if (this.artifact !== undefined) {
      await this.selectArtifact(this.artifact);
    }
    await this.waitForArtifactReady();
  }

  /** Ticks a plugin's checkbox in the playground and waits for the iframe to reload. */
  async enablePlugin(packageName: string): Promise<void> {
    const navigated = this.waitForPreviewNavigation();
    await this.page.getByRole("checkbox", { name: packageName }).check();
    await navigated;
    await this.waitForArtifactReady();
  }

  /** Fills a plugin's config textbox and waits for the iframe to reload. */
  async fillPluginConfig(packageName: string, json: string): Promise<void> {
    const navigated = this.waitForPreviewNavigation();
    await this.page.getByRole("textbox", { name: `Config for ${packageName}` }).fill(json);
    await navigated;
  }
}
