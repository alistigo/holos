interface HtmlToImageGlobal {
  toPng(node: HTMLElement, options?: Record<string, unknown>): Promise<string>;
  toCanvas(node: HTMLElement, options?: Record<string, unknown>): Promise<HTMLCanvasElement>;
}

declare global {
  interface Window {
    htmlToImage: HtmlToImageGlobal;
  }
}

export {};
