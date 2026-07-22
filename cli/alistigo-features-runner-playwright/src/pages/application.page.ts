import type { FrameLocator, Page } from "playwright";
import { deleteButtonName, ROLES, TEST_IDS } from "../support/selectors";

declare global {
  var __alistigoDebugTriggerRenderError: (() => void) | undefined;
}

export class ApplicationPage {
  private readonly applicationUrl: string;
  private readonly page: Page;

  constructor(applicationUrl: string, page: Page) {
    this.applicationUrl = applicationUrl;
    this.page = page;
  }

  private get artifactFrame(): FrameLocator {
    return this.page.frameLocator('iframe[title="Artifact preview"]');
  }

  async open(): Promise<void> {
    await this.page.goto(this.applicationUrl);
    await this.waitForArtifactReady();
  }

  async waitForArtifactReady(): Promise<void> {
    await this.artifactFrame.getByTestId(TEST_IDS.app).waitFor({ state: "visible" });
  }

  // fallow-ignore-next-line unused-class-member
  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitForArtifactReady();
  }

  // fallow-ignore-next-line unused-class-member
  async waitForPluginInitialized(): Promise<void> {
    await this.artifactFrame
      .locator(`[data-testid="${TEST_IDS.fakePlugin}"][data-initialized="true"]`)
      .waitFor({ state: "attached" });
  }

  // fallow-ignore-next-line unused-class-member
  async isPluginInitialized(): Promise<boolean> {
    const marker = this.artifactFrame.getByTestId(TEST_IDS.fakePlugin);
    return (await marker.getAttribute("data-initialized")) === "true";
  }

  // fallow-ignore-next-line unused-class-member
  async waitForPluginCapturedError(): Promise<void> {
    await this.artifactFrame
      .locator(`[data-testid="${TEST_IDS.fakePlugin}"][data-captured-error="true"]`)
      .waitFor({ state: "attached" });
  }

  // fallow-ignore-next-line unused-class-member
  async triggerDebugRenderError(): Promise<void> {
    const frame = this.page.frame("artifact-preview");
    if (!frame) throw new Error("artifact-preview frame not found");
    await frame.waitForFunction(() => typeof __alistigoDebugTriggerRenderError === "function");
    await frame.evaluate(() => __alistigoDebugTriggerRenderError?.());
  }

  // fallow-ignore-next-line unused-class-member
  async addElement(text: string): Promise<void> {
    const input = this.artifactFrame.getByRole(ROLES.addInput.role, { name: ROLES.addInput.name });
    await input.fill(text);
    await input.press("Enter");
    await this.waitForIdle();
  }

  // fallow-ignore-next-line unused-class-member
  async deleteElement(text: string): Promise<void> {
    const button = this.artifactFrame.getByRole(ROLES.rowDelete.role, { name: deleteButtonName(text) });
    const count = await button.count();
    if (count === 0) {
      throw new Error(`No element with text "${text}" found to delete.`);
    }
    if (count > 1) {
      throw new Error(
        `Ambiguous: ${count} elements with text "${text}". Use \`When I delete row N\` instead.`,
      );
    }
    await button.click();
    await this.waitForIdle();
  }

  // fallow-ignore-next-line unused-class-member
  async deleteRow(rowNumber: number): Promise<void> {
    const list = this.artifactFrame.getByRole(ROLES.list.role);
    const row = list.getByRole(ROLES.row.role).nth(rowNumber - 1);
    await row.getByRole(ROLES.rowDelete.role).click();
    await this.waitForIdle();
  }

  // fallow-ignore-next-line unused-class-member
  async getListItems(): Promise<string[]> {
    const list = this.artifactFrame.getByRole(ROLES.list.role);
    const rows = list.getByRole(ROLES.row.role);
    const count = await rows.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      if ((await row.getAttribute("data-deleting")) !== null) continue;
      const accessibleName = (await row.getAttribute("aria-label")) ?? (await row.innerText());
      texts.push(accessibleName.trim());
    }
    return texts;
  }

  // fallow-ignore-next-line unused-class-member
  async isEmptyStateVisible(): Promise<boolean> {
    return this.artifactFrame.getByTestId(TEST_IDS.emptyState).isVisible();
  }

  private async waitForIdle(): Promise<void> {
    await this.artifactFrame
      .locator(`[data-testid="${TEST_IDS.actionPending}"][data-state="pending"]`)
      .waitFor({ state: "attached", timeout: 1000 })
      .catch(() => undefined);

    await this.artifactFrame
      .locator(`[data-testid="${TEST_IDS.actionPending}"][data-state="idle"]`)
      .waitFor({ state: "attached" });
  }
}
