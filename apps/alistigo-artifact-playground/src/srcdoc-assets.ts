/**
 * Everything about the injected document that only Vite can resolve.
 *
 * `buildIframeSrcdoc.ts` used to import these at module scope, which made it
 * impossible to import from `bun test` at all: `?raw`, `?url` and
 * `import.meta.env` are Vite transforms, not runtime features. Keeping them here
 * and passing the resulting values in leaves the builder a pure function of its
 * arguments — and lets a test feed a stub bridge string and assert the AI-bridge
 * segment contains exactly it.
 */

import claudeBridgeHtml from "@alistigo/claude-artifact-api/inject-script.html?raw";
// Served from this app's own origin rather than cdnjs, so a features run needs
// no network: cdnjs serves the *minified* build under a Subresource Integrity
// hash that the unminified file on npm cannot satisfy, so the previous CDN
// script tag could not be route-intercepted by the test harness without the
// browser rejecting it. Vite emits this as an asset and hands back its URL, in
// dev and in a build alike.
//
// `cdnjs.cloudflare.com` deliberately stays in the CSP below: that directive
// models the sandbox a real Claude artifact runs inside, not what this app
// happens to need.
import htmlToImageUrl from "html-to-image/dist/html-to-image.js?url";
import type { SrcdocAssets } from "./buildIframeSrcdoc";

const _devHost = typeof __ALISTIGO_DEV_HOSTNAME__ !== "undefined" ? __ALISTIGO_DEV_HOSTNAME__ : "";
const _devHostOrigins = _devHost ? [`http://${_devHost}:*`, `ws://${_devHost}:*`] : [];

export const SRCDOC_CSP = [
  "default-src 'none'",
  [
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
    "http://localhost:* http://127.0.0.1:*",
    ..._devHostOrigins.slice(0, 1),
  ].join(" "),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  [
    "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*",
    ..._devHostOrigins,
  ].join(" "),
  ["frame-src 'self' http://localhost:* http://127.0.0.1:*", ..._devHostOrigins.slice(0, 1)].join(
    " ",
  ),
  "worker-src blob:",
  "media-src 'self' blob:",
].join("; ");

/** The bridge assets the AI-bridge segment is built from. */
export const SRCDOC_ASSETS: SrcdocAssets = {
  bridgeHtml: claudeBridgeHtml,
  htmlToImageUrl,
};
