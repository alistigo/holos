/**
 * The document injected into the preview iframe, as an ordered list of tagged
 * parts.
 *
 * Why parts rather than one template string: the preview panel shows the whole
 * document in its Source tab and one slice of it in each of the AI Bridge,
 * Artifact source and Playground source tabs, and those slices have to account
 * for the whole thing with nothing missing and nothing shown twice (FR-017). If
 * each tab filtered the finished HTML with its own string surgery, that property
 * would be maintained by hand and would rot the first time a `<script>` moved.
 * With one ordered list and one `segment` per part, completeness is "every part
 * has a segment" and non-duplication is "each part has exactly one" — both
 * checkable in a few lines, and neither able to drift as the template changes.
 *
 * This module is pure: the two Vite-resolved values live in `srcdoc-assets.ts`
 * and arrive through `options.assets`, so `bun test` can import it.
 */

import type { Config } from "./playground-config";

// SRCDOC_CSP is NOT re-exported from here. `srcdoc-assets.ts` imports the
// SrcdocAssets type from this module, so a re-export would close an import
// cycle — and qa:arch-check counts type-only imports and treats a cycle as an
// error. Consumers import the CSP from `srcdoc-assets.ts` directly.

/** Which concern a piece of the injected document belongs to. */
export type SrcdocSegment = "playground" | "ai-bridge" | "artifact" | "config" | "ai-input";

export interface SrcdocPart {
  readonly segment: SrcdocSegment;
  readonly text: string;
}

/** The bridge assets, passed in so the builder stays importable without Vite. */
export interface SrcdocAssets {
  /** The claude-artifact-api inject-script HTML (`?raw` in the app, a stub in tests). */
  readonly bridgeHtml: string;
  /** URL of the html-to-image bundle the bridge needs (`?url` in the app). */
  readonly htmlToImageUrl: string;
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
  /** The Vite-resolved bridge assets; see `srcdoc-assets.ts`. */
  assets: SrcdocAssets;
}

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

function buildClaudeHeadScripts(assets: SrcdocAssets): string {
  return [
    // Same-origin, so no `integrity`/`crossorigin` is needed — SRI guards
    // against a compromised third-party host, which this no longer is.
    `<script src="${assets.htmlToImageUrl}"></script>`,
    assets.bridgeHtml,
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
 *
 * It is `playground`, not `artifact`: it is host page content the playground
 * supplies for a widget to annotate, not part of the artifact bundle.
 */
function buildHostSurface(app: string): string {
  if (app !== "@alistigo/artifact-ai-draw-comments") return "";
  return `<article data-testid="draw-comments-host-surface" style="max-width:48rem;margin:0 auto;padding:1.5rem;font-family:sans-serif;color:#333">
      <h1 style="font-size:1.5rem;margin:0 0 1rem">Quarterly report</h1>
      <p style="line-height:1.6;margin:0 0 1rem">This panel stands in for a host artifact. Click &ldquo;Draw Comment&rdquo;, drag a region over this text, draw on it, and send the annotation to Claude.</p>
      <p style="line-height:1.6;margin:0">Revenue grew across all three regions this quarter, with the strongest movement in the north. Operating costs held flat against a 12% increase in volume, and the margin improvement carried through to the bottom line.</p>
    </article>`;
}

/** The console shim, and everything above the bridge in <head>. */
function buildDocumentOpen(): string {
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
    `;
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

/**
 * The injected document as an ordered list of tagged parts.
 *
 * The parts carry the template's own whitespace, and `assembleSrcdoc` joins them
 * with the empty string, so the assembled result is byte-for-byte what the
 * previous single-template implementation produced (rule S-1). That matters
 * beyond tidiness: the end-to-end harness parses `#alistigo-config` out of this
 * document, intercepts the URL the entry tag requests, and waits on the
 * draw-comments host surface.
 */
// fallow-ignore-next-line complexity
export function buildIframeParts(options: BuildIframeSrcdocOptions): SrcdocPart[] {
  const { config, aiInputMarkdown, scriptUrl, csp, isDev, devPluginUrlOverrides, assets } = options;
  const isClaude = config.aiContext === "claude";
  const cfgJson = JSON.stringify(buildArtifactConfig(config));

  const parts: SrcdocPart[] = [{ segment: "playground", text: buildDocumentOpen() }];

  if (isClaude) {
    // One part, holding exactly what the template interpolated: the two bridge
    // scripts and the published-status line the real Claude host sets.
    parts.push({
      segment: "ai-bridge",
      text: `${buildClaudeHeadScripts(assets)}\n    ${buildArtifactStatusScript(config.published)}`,
    });
  }

  parts.push({
    segment: "playground",
    text: `\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.app}</title>
    `,
  });

  parts.push({
    segment: "config",
    text: `<script type="application/json" id="alistigo-config">${cfgJson}</script>`,
  });

  parts.push({
    segment: "playground",
    text: `\n    ${buildPluginOverrideScript(devPluginUrlOverrides)}
    ${isDev ? buildDevRefreshScript() : ""}
  </head>
  <body id="artifacts-component-root-html">
    `,
  });

  if (aiInputMarkdown !== undefined) {
    parts.push({ segment: "ai-input", text: buildAiInputScript(aiInputMarkdown) });
  }

  parts.push({ segment: "playground", text: `\n    ${buildHostSurface(config.app)}\n    ` });
  parts.push({ segment: "artifact", text: buildEntryScript(scriptUrl) });
  parts.push({ segment: "playground", text: "\n  </body>\n</html>" });

  return parts;
}

/**
 * The whole document.
 *
 * Joined with the empty string, never a separator: the parts already carry the
 * document's whitespace, and anything added here would change the bytes the
 * iframe and the end-to-end suites see.
 */
export function assembleSrcdoc(parts: readonly SrcdocPart[]): string {
  return parts.map((part) => part.text).join("");
}

/**
 * One segment, for display.
 *
 * Joined with a newline rather than the empty string, because a segment's parts
 * are not adjacent in the document and reading them butted together would be
 * worse. Trimmed at the ends so a tab does not open on the indentation that
 * happened to sit between two parts. Display only — `assembleSrcdoc` is what the
 * iframe gets.
 */
export function segmentSource(parts: readonly SrcdocPart[], segment: SrcdocSegment): string {
  return parts
    .filter((part) => part.segment === segment)
    .map((part) => part.text)
    .join("\n")
    .trim();
}

/** The whole injected document. Equals `assembleSrcdoc(buildIframeParts(options))`. */
export function buildIframeSrcdoc(options: BuildIframeSrcdocOptions): string {
  return assembleSrcdoc(buildIframeParts(options));
}
