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
import type { Config } from "./hooks/useHostConfig";

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

function buildEntryScript(scriptUrl: string): string {
  return `<script type="module" src="${scriptUrl}"></script>`;
}

function buildPluginOverrideScript(overrides: Record<string, string> | undefined): string {
  if (overrides === undefined) return "";
  return `<script>window.__ALISTIGO_PLUGIN_URL_OVERRIDES__ = ${JSON.stringify(overrides)};</script>`;
}

function buildDevRefreshScript(): string {
  return `<script type="module">
      import { injectIntoGlobalHook } from "/@react-refresh";
      // injectIntoGlobalHook calls console.info which may be absent in sandboxed
      // headless-Chromium iframes. Guard so React can still mount.
      try { injectIntoGlobalHook(window); } catch (_e) {}
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;
    </script>`;
}

function buildClaudeHeadScripts(): string {
  return [
    // Same-origin, so no `integrity`/`crossorigin` is needed — SRI guards
    // against a compromised third-party host, which this no longer is.
    `<script src="${htmlToImageUrl}"></script>`,
    claudeBridgeHtml,
  ].join("\n    ");
}

function buildArtifactStatusScript(published: boolean): string {
  if (!published) return "";
  return `<script>window.claudeArtifactStatus = "published";</script>`;
}

function buildAiInputScript(markdown: string): string {
  return `<script id="ai-input-action" type="text/markdown">${markdown}</script>`;
}

/**
 * Static host content for artifacts that annotate a host page rather than own it.
 *
 * The draw-comments widget is an embeddable overlay: it prepends itself to the
 * host body and expects content behind it to select a region over and draw on.
 * An empty iframe body gives it nothing to annotate.
 *
 * This lives in the srcdoc rather than in `artifact-entry.tsx` because that
 * module only runs in dev — a preview/production build points the iframe
 * straight at the artifact's registry URL. The srcdoc is built by the host page
 * in both modes, so this is the only place the surface exists either way.
 */
function buildHostSurface(app: string): string {
  if (app !== "@alistigo/artifact-ai-draw-comments") return "";
  return `<article data-testid="draw-comments-host-surface" style="max-width:48rem;margin:0 auto;padding:1.5rem;font-family:sans-serif;color:#333">
      <h1 style="font-size:1.5rem;margin:0 0 1rem">Quarterly report</h1>
      <p style="line-height:1.6;margin:0 0 1rem">This panel stands in for a host artifact. Click &ldquo;Draw Comment&rdquo;, drag a region over this text, draw on it, and send the annotation to Claude.</p>
      <p style="line-height:1.6;margin:0">Revenue grew across all three regions this quarter, with the strongest movement in the north. Operating costs held flat against a 12% increase in volume, and the margin improvement carried through to the bottom line.</p>
    </article>`;
}

/** Builds the config object injected into the artifact iframe. */
export function buildArtifactConfig(config: Config): Record<string, unknown> {
  const cfg: Record<string, unknown> = {
    app: config.app,
    lang: config.lang,
    readonly: config.readonly,
  };
  if (Object.keys(config.plugins).length > 0) {
    cfg.plugins = config.plugins;
  }
  return cfg;
}

export interface BuildIframeSrcdocOptions {
  config: Config;
  /** Markdown string injected as #ai-input-action for fixture testing. */
  aiInputMarkdown?: string;
  /** Absolute URL to the artifact-entry module. */
  scriptUrl: string;
  /** CSP directive string for the <meta http-equiv> tag. */
  csp: string;
  /** True in dev — injects the @vitejs/plugin-react preamble the HTML transform hook normally adds. */
  isDev?: boolean;
  /**
   * Dev only: package name -> local dev-server URL, so plugins load from source
   * instead of jsDelivr. Injected as `window.__ALISTIGO_PLUGIN_URL_OVERRIDES__`,
   * read by @alistigo/artifact-plugin-api's loader.ts before it hits the CDN.
   */
  devPluginUrlOverrides?: Record<string, string> | undefined;
}

// fallow-ignore-next-line complexity
export function buildIframeSrcdoc({
  config,
  aiInputMarkdown,
  scriptUrl,
  csp,
  isDev,
  devPluginUrlOverrides,
}: BuildIframeSrcdocOptions): string {
  const cfgJson = JSON.stringify(buildArtifactConfig(config));

  const isClaude = config.aiContext === "claude";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <script>
      // Replace window.console with a new object where every method is a real
      // function. In sandboxed headless-Chromium iframes some console methods
      // (e.g. console.info, console.debug) are absent; patching the existing
      // native object fails because those properties are non-configurable.
      // Replacing window.console itself works because that property is writable.
      (function(){var c=window.console||{};var fb=(c.log||function(){}).bind(c);var nc={};["log","debug","info","warn","error","trace","group","groupCollapsed","groupEnd","dir","table","assert","count","countReset","time","timeEnd","timeLog","clear","profile","profileEnd","dirxml"].forEach(function(m){nc[m]=typeof c[m]==="function"?c[m].bind(c):fb;});try{window.console=nc;}catch(e){try{Object.defineProperty(window,"console",{value:nc,writable:true,configurable:true});}catch(e2){}}})();
    </script>
    ${isClaude ? `${buildClaudeHeadScripts()}\n    ${buildArtifactStatusScript(config.published)}` : ""}
    <meta http-equiv="Content-Security-Policy" content="${csp}" />
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.app}</title>
    <script type="application/json" id="alistigo-config">${cfgJson}</script>
    ${buildPluginOverrideScript(devPluginUrlOverrides)}
    ${isDev ? buildDevRefreshScript() : ""}
  </head>
  <body id="artifacts-component-root-html">
    ${aiInputMarkdown !== undefined ? buildAiInputScript(aiInputMarkdown) : ""}
    ${buildHostSurface(config.app)}
    ${buildEntryScript(scriptUrl)}
  </body>
</html>`;
}
