import claudeBridgeHtml from "../../../ai/claude/inject-script.html?raw";
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

function buildClaudeHeadScripts(): string {
  return [
    `<script src="https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.13/html-to-image.min.js" integrity="sha512-iZ2ORl595Wx6miw+GuadDet4WQbdSWS3JLMoNfY8cRGoEFy6oT3G9IbcrBeL6AfkgpA51ETt/faX6yLV+/gFJg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>`,
    claudeBridgeHtml,
  ].join("\n    ");
}

export interface BuildIframeSrcdocOptions {
  config: Config;
  /** JSON string for the #alistigo-document script tag. */
  docJson: string;
  /** Absolute URL to the artifact-entry module. */
  scriptUrl: string;
  /** CSP directive string for the <meta http-equiv> tag. */
  csp: string;
  /** True in dev — injects the @vitejs/plugin-react preamble the HTML transform hook normally adds. */
  isDev?: boolean;
}

export function buildIframeSrcdoc({
  config,
  docJson,
  scriptUrl,
  csp,
  isDev,
}: BuildIframeSrcdocOptions): string {
  const cfg: Record<string, unknown> = {
    app: config.app,
    lang: config.lang,
    readonly: config.readonly,
  };
  if (Object.keys(config.plugins).length > 0) {
    cfg.plugins = config.plugins;
  }
  // aiContext and document are playground-only — not consumed by @alistigo/artifact-list
  const cfgJson = JSON.stringify(cfg);

  const isClaude = config.aiContext === "claude";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    ${isClaude ? buildClaudeHeadScripts() : ""}
    <meta http-equiv="Content-Security-Policy" content="${csp}" />
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.app}</title>
    <script type="application/json" id="alistigo-config">${cfgJson}</script>
    ${
      isDev
        ? `<script type="module">
      import { injectIntoGlobalHook } from "/@react-refresh";
      injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;
    </script>`
        : ""
    }
  </head>
  <body id="artifacts-component-root-html">
    <script type="application/json" id="alistigo-document">${docJson}</script>
    <script type="module" src="${scriptUrl}"></script>
  </body>
</html>`;
}
