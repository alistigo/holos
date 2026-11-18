import { PlaygroundPage } from "@alistigo/artifact-features-runner-playwright/harness";
import type { Locator } from "playwright";
import { CANVAS_SELECTOR, RESPONSE_SELECTOR, ROLES, TEST_IDS } from "./selectors.js";

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The draw-comments widget's page object.
 *
 * Navigation, artifact selection and readiness waiting come from
 * `PlaygroundPage` in the runner's harness. What lives here is the widget's own
 * vocabulary: starting an annotation, dragging a region, drawing on the canvas,
 * sending, and reading back the resulting thread.
 *
 * Drag gestures go through `page.mouse` on the HOST page, in host viewport
 * coordinates, because that is the only way to drive both the overlay's React
 * mouse handlers and Konva's own stage events. Region coordinates are therefore
 * translated through the preview iframe's bounding box.
 */
export class DrawCommentsPage extends PlaygroundPage {
  /**
   * Offset of the preview iframe within the host page. Public because geometry
   * assertions need to translate iframe-relative regions into host coordinates.
   */
  async frameOrigin(): Promise<{ x: number; y: number }> {
    const frame = this.previewFrame;
    if (frame === null) throw new Error("artifact-preview frame not found");
    const element = await frame.frameElement();
    const box = await element.boundingBox();
    if (box === null) throw new Error("preview iframe has no bounding box");
    return { x: box.x, y: box.y };
  }

  private role(key: keyof typeof ROLES): Locator {
    const { role, name } = ROLES[key];
    return this.artifactFrame.getByRole(role, { name });
  }

  get drawCommentButton(): Locator {
    return this.role("drawCommentButton");
  }

  get sendButton(): Locator {
    return this.role("sendButton");
  }

  get commentInput(): Locator {
    return this.role("commentInput");
  }

  get annotationImage(): Locator {
    return this.role("annotationImage");
  }

  get selectionOverlay(): Locator {
    return this.artifactFrame.getByTestId(TEST_IDS.selectionOverlay);
  }

  get selectionIndicator(): Locator {
    return this.artifactFrame.getByTestId(TEST_IDS.selectionIndicator);
  }

  get drawPanel(): Locator {
    return this.artifactFrame.getByTestId(TEST_IDS.drawPanel);
  }

  get hostSurface(): Locator {
    return this.artifactFrame.getByTestId(TEST_IDS.hostSurface);
  }

  get canvas(): Locator {
    return this.artifactFrame.locator(CANVAS_SELECTOR);
  }

  async startAnnotation(): Promise<void> {
    await this.drawCommentButton.click();
    await this.selectionOverlay.waitFor({ state: "visible" });
  }

  /** Drags a region in iframe-relative coordinates and waits for the canvas. */
  async dragRegion(box: Box): Promise<void> {
    const origin = await this.frameOrigin();
    await this.page.mouse.move(origin.x + box.x, origin.y + box.y);
    await this.page.mouse.down();
    await this.page.mouse.move(origin.x + box.x + box.width, origin.y + box.y + box.height, {
      steps: 10,
    });
    await this.page.mouse.up();
  }

  /** Drags without releasing, so the in-progress selection indicator can be read. */
  async beginRegionDrag(box: Box): Promise<void> {
    const origin = await this.frameOrigin();
    await this.page.mouse.move(origin.x + box.x, origin.y + box.y);
    await this.page.mouse.down();
    await this.page.mouse.move(origin.x + box.x + box.width, origin.y + box.y + box.height, {
      steps: 10,
    });
  }

  async releaseRegionDrag(): Promise<void> {
    await this.page.mouse.up();
  }

  async waitForCanvas(): Promise<void> {
    await this.canvas.waitFor({ state: "attached" });
  }

  /** Draws a shape on the canvas, offset from the canvas's own top-left. */
  async drawShape(offset: Box): Promise<void> {
    await this.waitForCanvas();
    const box = await this.canvas.boundingBox();
    if (box === null) throw new Error("canvas has no bounding box");
    await this.page.mouse.move(box.x + offset.x, box.y + offset.y);
    await this.page.mouse.down();
    await this.page.mouse.move(box.x + offset.x + offset.width, box.y + offset.y + offset.height, {
      steps: 8,
    });
    await this.page.mouse.up();
  }

  async selectTool(tool: "Rectangle" | "Line"): Promise<void> {
    await this.role(tool === "Rectangle" ? "rectangleTool" : "lineTool").click();
  }

  async typeComment(text: string): Promise<void> {
    await this.commentInput.fill(text);
  }

  async send(): Promise<void> {
    await this.sendButton.click();
  }

  async cancelFromSelection(): Promise<void> {
    await this.role("cancelSelection").click();
  }

  async cancelFromDrawing(): Promise<void> {
    await this.role("cancelAnnotation").click();
  }

  /** The annotation image's data URL, once the thread has rendered it. */
  async waitForAnnotationImage(): Promise<string> {
    await this.annotationImage.waitFor({ state: "visible", timeout: 25_000 });
    return (await this.annotationImage.getAttribute("src")) ?? "";
  }

  /** Claude's response text, once it has been rendered under the annotation. */
  async waitForResponse(): Promise<string> {
    const response = this.artifactFrame.locator(RESPONSE_SELECTOR).first();
    await response.waitFor({ state: "visible", timeout: 25_000 });
    // Awaiting non-empty text rather than assuming the simulator answered
    // synchronously: its delay is configurable.
    for (let attempt = 0; attempt < 50; attempt++) {
      const text = (await response.textContent()) ?? "";
      if (text.trim().length > 0) return text.trim();
      await this.page.waitForTimeout(100);
    }
    return "";
  }

  /** Bounding box of the canvas in host coordinates, for geometry assertions. */
  async canvasBox(): Promise<Box | null> {
    return this.canvas.boundingBox();
  }

  /** Counts page loads of the preview document, to prove no reload happened. */
  async stampLoadMarker(): Promise<void> {
    const frame = this.previewFrame;
    if (frame === null) throw new Error("artifact-preview frame not found");
    await frame.evaluate(() => {
      Object.assign(globalThis, { __drawCommentsLoadMarker: "set" });
    });
  }

  async loadMarkerSurvived(): Promise<boolean> {
    const frame = this.previewFrame;
    if (frame === null) return false;
    return frame.evaluate(
      () =>
        (globalThis as { __drawCommentsLoadMarker?: string }).__drawCommentsLoadMarker === "set",
    );
  }
}
