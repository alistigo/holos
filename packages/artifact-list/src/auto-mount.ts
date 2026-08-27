import type { AlistigoDocument } from "@alistigo/list";
import { type MountOptions, mount } from "./mount.js";
import { readAiInitialInput } from "./utils/ai-input-action.js";
import { resolveAutoMountTarget } from "./utils/container.js";

interface AutoMountConfig extends MountOptions {
  /** CSS selector for the mount target. If omitted, a <div> is appended to <body>. */
  container?: string;
}

// Tracked across calls so re-mount (e.g. fixture picker) reuses the same container
// instead of appending a second element.
let mountedContainer: HTMLElement | undefined;

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

function resolveInitialDocument(config: AutoMountConfig): AlistigoDocument | undefined {
  // Prefer AI markdown input (new format) over legacy config.document (JSON).
  const aiDoc = readAiInitialInput();
  if (aiDoc !== undefined) return aiDoc;
  return config.document;
}

function autoMount(): void {
  const config = parseAutoMountConfig();
  if (!mountedContainer) {
    mountedContainer = resolveAutoMountTarget(config.container);
  }
  const doc = resolveInitialDocument(config);
  const { container: _c, document: _d, ...baseOptions } = config;
  const options: MountOptions = doc !== undefined ? { ...baseOptions, document: doc } : baseOptions;
  void mount(mountedContainer, options);
}

export default autoMount;
