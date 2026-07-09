import type { AlistigoDocument } from "@alistigo/document-format";
import { type MountOptions, mount } from "./mount.js";
import { resolveAutoMountTarget } from "./utils/container.js";

interface AutoMountConfig extends MountOptions {
  /** CSS selector for the mount target. If omitted, a <div> is appended to <body>. */
  container?: string;
}

// Tracked across calls so re-mount (e.g. fixture picker) reuses the same container
// instead of appending a second element.
let mountedContainer: HTMLElement | undefined;

function readInlineDocument(): AlistigoDocument | undefined {
  const el = document.getElementById("alistigo-document");
  if (!el?.textContent?.trim()) return undefined;
  try {
    return JSON.parse(el.textContent) as AlistigoDocument;
  } catch {
    console.error("[Alistigo] Failed to parse #alistigo-document");
    return undefined;
  }
}

function parseAutoMountConfig(): AutoMountConfig {
  const configEl = document.getElementById("alistigo-config");
  if (configEl === null) return {};
  try {
    return JSON.parse(configEl.textContent ?? "{}") as AutoMountConfig;
  } catch {
    console.error("[Alistigo] Failed to parse #alistigo-config:", configEl.textContent);
    return {};
  }
}

function autoMount(): void {
  const config = parseAutoMountConfig();
  if (!mountedContainer) {
    mountedContainer = resolveAutoMountTarget(config.container);
  }
  const doc = readInlineDocument() ?? config.document;
  const { container: _c, document: _d, ...baseOptions } = config;
  const options: MountOptions = doc !== undefined ? { ...baseOptions, document: doc } : baseOptions;
  void mount(mountedContainer, options);
}

export default autoMount;
