import {
  ArtifactWorld,
  type PlaygroundPage,
} from "@alistigo/artifact-features-runner-playwright/harness";
import { setWorldConstructor } from "@cucumber/cucumber";
import { type Box, DrawCommentsPage } from "./draw-comments.page.js";

/** A region comfortably above the overlay's 20x20 px minimum, over the host prose. */
const DEFAULT_REGION: Box = { x: 80, y: 180, width: 340, height: 150 };

/** A shape drawn well inside the region. */
const DEFAULT_SHAPE: Box = { x: 30, y: 30, width: 130, height: 80 };

const TEST_COMMENT = "Look at this area";

/**
 * The draw-comments domain World.
 *
 * The browser, the context and page, route interception, opening the playground
 * and screenshots on failure all belong to `ArtifactWorld` in the runner's
 * harness. What is here is per-scenario domain state: the region and shape the
 * steps agreed on, the comment typed, and the results read back.
 */
export class DrawCommentsWorld extends ArtifactWorld {
  declare playgroundPage: DrawCommentsPage;

  region: Box = DEFAULT_REGION;
  shape: Box = DEFAULT_SHAPE;
  comment = "";
  annotationImageSrc = "";
  claudeResponse = "";

  protected override createPlaygroundPage(): PlaygroundPage {
    return new DrawCommentsPage(this.baseUrl, this.page, this.artifact);
  }

  /** The widget page object, named for how the steps read. */
  get widget(): DrawCommentsPage {
    return this.playgroundPage;
  }

  /** Walks the widget from idle to the drawing phase with one shape drawn. */
  async drawOneShape(): Promise<void> {
    await this.widget.startAnnotation();
    await this.widget.dragRegion(this.region);
    await this.widget.waitForCanvas();
    await this.widget.drawShape(this.shape);
  }

  /** Completes a full annotate -> send -> respond cycle. */
  async completeCycle(comment: string = TEST_COMMENT): Promise<void> {
    await this.drawOneShape();
    this.comment = comment;
    await this.widget.typeComment(comment);
    await this.widget.send();
    this.annotationImageSrc = await this.widget.waitForAnnotationImage();
    this.claudeResponse = await this.widget.waitForResponse();
  }
}

setWorldConstructor(DrawCommentsWorld);
