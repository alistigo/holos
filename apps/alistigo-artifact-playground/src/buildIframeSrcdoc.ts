import claudeBridgeHtml from "@alistigo/claude-artifact-api/inject-script.html?raw";
import type { Config } from "./hooks/useHostConfig";

export const SRCDOC_CSP = [
  "default-src 'none'",
  "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net http://localhost:* http://127.0.0.1:*",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*",
  "frame-src 'self' http://localhost:* http://127.0.0.1:*",
  "worker-src blob:",
  "media-src 'self' blob:",
].join("; ");

function buildEntryScript(scriptUrl: string, isDev: boolean): string {
  return isDev
    ? `<script type="module" src="${scriptUrl}"></script>`
    : `<script src="${scriptUrl}"></script>`;
}

function buildPluginOverrideScript(overrides: Record<string, string> | undefined): string {
  if (overrides === undefined) return "";
  return `<script>window.__ALISTIGO_PLUGIN_URL_OVERRIDES__ = ${JSON.stringify(overrides)};</script>`;
}

function buildDevRefreshScript(): string {
  return `<script type="module">
      import { injectIntoGlobalHook } from "/@react-refresh";
      injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;
    </script>`;
}

function buildClaudeHeadScripts(): string {
  return [
    `<script src="https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.13/html-to-image.min.js" integrity="sha512-iZ2ORl595Wx6miw+GuadDet4WQbdSWS3JLMoNfY8cRGoEFy6oT3G9IbcrBeL6AfkgpA51ETt/faX6yLV+/gFJg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>`,
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
    ${buildEntryScript(scriptUrl, isDev ?? false)}
  </body>
</html>`;
}
