import type { Stage } from "konva/lib/Stage";
import type { AnnotatedSnapshot } from "../domain/session.js";

export async function buildAnnotatedSnapshot(
  regionEl: HTMLElement,
  konvaStage: Stage,
  comment: string,
): Promise<AnnotatedSnapshot> {
  const domDataUrl = await window.htmlToImage.toPng(regionEl);
  const shapesDataUrl = konvaStage.toDataURL({ mimeType: "image/png" });

  const canvas = document.createElement("canvas");
  canvas.width = regionEl.offsetWidth;
  canvas.height = regionEl.offsetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2D context for annotation composite");
  }

  await new Promise<void>((resolve, reject) => {
    const domImg = new Image();
    domImg.onload = () => {
      ctx.drawImage(domImg, 0, 0);
      const shapesImg = new Image();
      shapesImg.onload = () => {
        ctx.drawImage(shapesImg, 0, 0);
        resolve();
      };
      shapesImg.onerror = reject;
      shapesImg.src = shapesDataUrl;
    };
    domImg.onerror = reject;
    domImg.src = domDataUrl;
  });

  const compositeDataUrl = canvas.toDataURL("image/png");
  const pngBase64 = compositeDataUrl.split(",")[1] ?? "";

  return { pngBase64, comment, capturedAt: Date.now() };
}
