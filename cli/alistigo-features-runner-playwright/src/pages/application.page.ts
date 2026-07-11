import type { Page } from "playwright";
import { deleteButtonName, ROLES, TEST_IDS } from "../support/selectors";

// This package's tsconfig has no DOM lib (Node-only), so the in-page callback
// below is typed against an ambient global var rather than `window.*`.
declare global {
  var __alistigoDebugTriggerRenderError: (() => void) | undefined;
}

export class ApplicationPage {
  private opened = false;
  private readonly applicationUrl: string;
  private readonly page: Page;

  constructor(applicationUrl: string, page: Page) {
    this.applicationUrl = applicationUrl;
    this.page = page;
  }

  async open(): Promise<void> {
    if (!this.opened) {
      await this.page.goto(this.applicationUrl);
      await this.page.getByTestId(TEST_IDS.app).waitFor({ state: "visible" });
      this.opened = true;
    }
  }

  async reload(): Promise<void> {
    await this.open();
    await this.page.reload();
    await this.page.getByTestId(TEST_IDS.app).waitFor({ state: "visible" });
  }

  async openWithPlugins(plugins: Record<string, Record<string, unknown>>): Promise<void> {
    const url = new URL(this.applicationUrl);
    url.searchParams.set("plugins", JSON.stringify(plugins));
    this.opened = false;
    await this.page.goto(url.toString());
    await this.page.getByTestId(TEST_IDS.app).waitFor({ state: "visible" });
    this.opened = true;
  }

  // fallow-ignore-next-line unused-class-member
  async waitForPluginInitialized(): Promise<void> {
    await this.page.waitForSelector(
      `[data-testid="${TEST_IDS.fakePlugin}"][data-initialized="true"]`,
      { state: "attached" },
    );
  }

  // fallow-ignore-next-line unused-class-member
  async isPluginInitialized(): Promise<boolean> {
    const marker = this.page.getByTestId(TEST_IDS.fakePlugin);
    return (await marker.getAttribute("data-initialized")) === "true";
  }

  // fallow-ignore-next-line unused-class-member
  async waitForPluginCapturedError(): Promise<void> {
    await this.page.waitForSelector(
      `[data-testid="${TEST_IDS.fakePlugin}"][data-captured-error="true"]`,
      { state: "attached" },
    );
  }

  // fallow-ignore-next-line unused-class-member
  async triggerDebugRenderError(): Promise<void> {
    await this.page.waitForFunction(() => typeof __alistigoDebugTriggerRenderError === "function");
    await this.page.evaluate(() => __alistigoDebugTriggerRenderError?.());
  }

  // fallow-ignore-next-line unused-class-member
  async addElement(text: string): Promise<void> {
    await this.open();
    const input = this.page.getByRole(ROLES.addInput.role, { name: ROLES.addInput.name });
    await input.fill(text);
    await input.press("Enter");
    await this.waitForIdle();
  }

  // fallow-ignore-next-line unused-class-member
  async deleteElement(text: string): Promise<void> {
    await this.open();
    const button = this.page.getByRole(ROLES.rowDelete.role, { name: deleteButtonName(text) });
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
    await this.open();
    const list = this.page.getByRole(ROLES.list.role);
    const row = list.getByRole(ROLES.row.role).nth(rowNumber - 1);
    await row.getByRole(ROLES.rowDelete.role).click();
    await this.waitForIdle();
  }

  // fallow-ignore-next-line unused-class-member
  async getListItems(): Promise<string[]> {
    await this.open();
    const list = this.page.getByRole(ROLES.list.role);
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
    await this.open();
    return this.page.getByTestId(TEST_IDS.emptyState).isVisible();
  }

  // fallow-ignore-next-line unused-class-member
  resetOpened(): void {
    this.opened = false;
  }

  // Waits for a pending→idle transition on the action-pending indicator.
  // Phase 1 catches the pending state to avoid resolving on the pre-action idle;
  // the short timeout handles the case where the dispatch settles before we arrive.
  private async waitForIdle(): Promise<void> {
    await this.page
      .waitForSelector(`[data-testid="${TEST_IDS.actionPending}"][data-state="pending"]`, {
        state: "attached",
        timeout: 1000,
      })
      .catch(() => undefined);

    await this.page.waitForSelector(
      `[data-testid="${TEST_IDS.actionPending}"][data-state="idle"]`,
      { state: "attached" },
    );
  }
}
