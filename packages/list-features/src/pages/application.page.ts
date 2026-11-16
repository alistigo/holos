import type { FrameLocator, Locator, Page } from "playwright";
import { deleteButtonName, ROLES, TEST_IDS } from "../support/selectors";

declare global {
  var __alistigoDebugTriggerRenderError: (() => void) | undefined;
  var __alistigoFakeSentryPlugin: { initialized: boolean; capturedError: boolean } | undefined;
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

  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitForArtifactReady();
  }

  async waitForPluginInitialized(): Promise<void> {
    const frame = this.page.frame("artifact-preview");
    if (!frame) throw new Error("artifact-preview frame not found");
    await frame.waitForFunction(() => __alistigoFakeSentryPlugin?.initialized === true);
  }

  async isPluginInitialized(): Promise<boolean> {
    const frame = this.page.frame("artifact-preview");
    if (!frame) return false;
    return frame.evaluate(() => __alistigoFakeSentryPlugin?.initialized === true);
  }

  async waitForPluginCapturedError(): Promise<void> {
    const frame = this.page.frame("artifact-preview");
    if (!frame) throw new Error("artifact-preview frame not found");
    await frame.waitForFunction(() => __alistigoFakeSentryPlugin?.capturedError === true);
  }

  async triggerDebugRenderError(): Promise<void> {
    const frame = this.page.frame("artifact-preview");
    if (!frame) throw new Error("artifact-preview frame not found");
    await frame.waitForFunction(() => typeof __alistigoDebugTriggerRenderError === "function");
    await frame.evaluate(() => __alistigoDebugTriggerRenderError?.());
  }

  async addElement(text: string): Promise<void> {
    const input = this.artifactFrame.getByRole(ROLES.addInput.role, { name: ROLES.addInput.name });
    await input.fill(text);
    await input.press("Enter");
    await this.waitForIdle();
  }

  async deleteElement(text: string): Promise<void> {
    const button = this.artifactFrame.getByRole(ROLES.rowDelete.role, {
      name: deleteButtonName(text),
    });
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

  async deleteRow(rowNumber: number): Promise<void> {
    const list = this.artifactFrame.getByRole(ROLES.list.role);
    const row = list.getByRole(ROLES.row.role).nth(rowNumber - 1);
    await row.getByRole(ROLES.rowDelete.role).click();
    await this.waitForIdle();
  }

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

  async isEmptyStateVisible(): Promise<boolean> {
    return this.artifactFrame.getByTestId(TEST_IDS.emptyState).isVisible();
  }

  async waitForUserIdentity(): Promise<void> {
    await this.artifactFrame
      .getByRole(ROLES.userMenu.role, { name: ROLES.userMenu.name })
      .waitFor({ state: "visible" });
  }

  async getUserPseudo(): Promise<string> {
    const text = await this.artifactFrame.getByTestId(TEST_IDS.userPseudo).textContent();
    return text?.trim() ?? "";
  }

  async openUserEditor(): Promise<void> {
    await this.artifactFrame.getByRole(ROLES.userMenu.role, { name: ROLES.userMenu.name }).click();
    await this.artifactFrame.getByRole(ROLES.editUser.role, { name: ROLES.editUser.name }).click();
  }

  private rowCheckbox(rowLocator: Locator): Locator {
    return rowLocator.getByRole(ROLES.rowCheckbox.role, { name: ROLES.rowCheckbox.name });
  }

  private async waitForCheckboxPluginReady(): Promise<void> {
    // Plugins are loaded asynchronously after the app root is visible.
    // Wait for at least one checkbox to appear before interacting.
    // Assumes the list is non-empty; callers that run on an empty list must guard separately.
    await this.artifactFrame
      .getByRole(ROLES.list.role)
      .getByRole(ROLES.rowCheckbox.role, { name: ROLES.rowCheckbox.name })
      .first()
      .waitFor({ state: "attached" });
  }

  async checkElement(text: string): Promise<void> {
    await this.waitForCheckboxPluginReady();
    const row = this.artifactFrame.getByRole(ROLES.row.role).filter({ hasText: text });
    await this.rowCheckbox(row).check();
  }

  async uncheckElement(text: string): Promise<void> {
    await this.waitForCheckboxPluginReady();
    const row = this.artifactFrame.getByRole(ROLES.row.role).filter({ hasText: text });
    await this.rowCheckbox(row).uncheck();
  }

  async isElementChecked(text: string): Promise<boolean> {
    await this.waitForCheckboxPluginReady();
    const row = this.artifactFrame.getByRole(ROLES.row.role).filter({ hasText: text });
    return this.rowCheckbox(row).isChecked();
  }

  async areAllElementsUnchecked(): Promise<boolean> {
    await this.waitForCheckboxPluginReady();
    const rows = this.artifactFrame.getByRole(ROLES.list.role).getByRole(ROLES.row.role);
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      if (await this.rowCheckbox(rows.nth(i)).isChecked()) return false;
    }
    return true;
  }

  async setPseudo(pseudo: string): Promise<void> {
    await this.artifactFrame
      .getByRole(ROLES.pseudoInput.role, { name: ROLES.pseudoInput.name })
      .fill(pseudo);
    // Wait for the debounced save to update the badge (600ms debounce + render time)
    await this.artifactFrame
      .getByTestId(TEST_IDS.userPseudo)
      .filter({ hasText: pseudo })
      .waitFor({ state: "attached", timeout: 3000 });
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
