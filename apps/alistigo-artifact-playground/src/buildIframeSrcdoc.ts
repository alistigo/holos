import type { Config } from "./hooks/useHostConfig";

export const SRCDOC_CSP = [
  "default-src 'none'",
  "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com http://localhost:* http://127.0.0.1:*",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*",
  "frame-src 'self' http://localhost:* http://127.0.0.1:*",
  "worker-src blob:",
  "media-src 'self' blob:",
].join("; ");

// Claude bridge script — mirrors the script injected by Claude's web-UI.
// Provides window.claude, window.storage, fetch proxy, console forwarding,
// screenshot, link interception, and window.open override inside the iframe.
// Inner template literals are escaped because this string is itself a template literal.
const CLAUDE_BRIDGE_SCRIPT = `(function() {
  const realParent = window.parent;
  const cryptoObj = window.crypto;
  const newRequestId =
    cryptoObj && typeof cryptoObj.randomUUID === "function"
      ? function () { return cryptoObj.randomUUID(); }
      : function () { return Date.now() + "-" + Math.random(); };
  const originalConsole = window.console;
  window.console = {
    log: (...args) => {
      originalConsole.log(...args);
      realParent.postMessage({ type: 'console', message: args.join(' ') }, '*');
    },
    error: (...args) => {
      originalConsole.error(...args);
      realParent.postMessage({ type: 'console', message: 'Error: ' + args.join(' ') }, '*');
    },
    warn: (...args) => {
      originalConsole.warn(...args);
      realParent.postMessage({ type: 'console', message: 'Warning: ' + args.join(' ') }, '*');
    }
  };

  let callbacksMap = new Map();
  let streamControllers = new Map();

  window.claude = {
    complete: (prompt) => {
      return new Promise((resolve, reject) => {
        const id = newRequestId();
        callbacksMap.set(id, { resolve, reject });
        realParent.postMessage({ type: 'claudeComplete', id, prompt }, '*');
      });
    }
  };

  window.storage = {
    get: (key, shared = false) => {
      return new Promise((resolve, reject) => {
        const id = newRequestId();
        callbacksMap.set(id, { resolve, reject });
        realParent.postMessage({ type: 'storageGet', id, key, shared }, '*');
      });
    },
    set: (key, value, shared = false) => {
      return new Promise((resolve, reject) => {
        const id = newRequestId();
        callbacksMap.set(id, { resolve, reject });
        realParent.postMessage({ type: 'storageSet', id, key, value, shared }, '*');
      });
    },
    delete: (key, shared = false) => {
      return new Promise((resolve, reject) => {
        const id = newRequestId();
        callbacksMap.set(id, { resolve, reject });
        realParent.postMessage({ type: 'storageDelete', id, key, shared }, '*');
      });
    },
    list: (prefix, shared = false) => {
      return new Promise((resolve, reject) => {
        const id = newRequestId();
        callbacksMap.set(id, { resolve, reject });
        realParent.postMessage({ type: 'storageList', id, prefix, shared }, '*');
      });
    }
  };

  let pendingBlobs = new Map();
  URL.createObjectURL = (blob) => {
    const blobId = \`blob-\${Date.now()}-\${Math.random()}\`;
    pendingBlobs.set(blobId, blob);
    return \`blob-request://\${blobId}\`;
  };

  URL.revokeObjectURL = (url) => {
    const blobId = url.replace("blob-request://", "");
    pendingBlobs.delete(blobId);
  };

  const getBlobFromURL = (url) => {
    const blobId = url.replace("blob-request://", "");
    return pendingBlobs.get(blobId);
  };

  window.fetch = (url, init = {}) => {
    return new Promise((resolve, reject) => {
      const id = newRequestId();
      const channelId = \`fetch-\${id}-\${Date.now()}\`;

      callbacksMap.set(id, {
        resolve: (response) => {
          if (response.status === 204 || response.status === 205 || response.status === 304) {
            try {
              resolve(new Response(null, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
              }));
            } catch (err) {
              reject(new TypeError('Bridge fetch: unconstructable response (status ' + response.status + ')'));
            }
            return;
          }
          const stream = new ReadableStream({
            start(controller) { streamControllers.set(channelId, controller); },
            cancel() { streamControllers.delete(channelId); }
          });
          try {
            resolve(new Response(stream, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers
            }));
          } catch (err) {
            streamControllers.delete(channelId);
            reject(new TypeError('Bridge fetch: unconstructable response (status ' + response.status + ')'));
          }
        },
        reject,
        channelId
      });

      realParent.postMessage({ type: 'proxyFetch', id, url, init, channelId }, '*');
    });
  };

  window.addEventListener('message', async (event) => {
    if (event.source !== realParent) return;
    if (event.data.type === 'takeScreenshot') {
      const screenshotNonce = event.data.nonce;
      const rootElement = document.getElementById('artifacts-component-root-html');
      if (!rootElement) {
        realParent.postMessage({ type: 'screenshotError', nonce: screenshotNonce, error: new Error('Root element not found') }, '*');
        return;
      }
      try {
        const screenshot = await htmlToImage.toPng(rootElement, {
          imagePlaceholder: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjePDgwX8ACOQDoNsk0PMAAAAASUVORK5CYII=",
        });
        realParent.postMessage({ type: 'screenshotData', nonce: screenshotNonce, data: screenshot }, '*');
      } catch (err) {
        realParent.postMessage({ type: 'screenshotError', nonce: screenshotNonce, error: err instanceof Error ? err : new Error(String(err)) }, '*');
      }
    } else if (event.data.type === 'claudeComplete') {
      const callback = callbacksMap.get(event.data.id);
      if (!callback) return;
      if (event.data.error) { callback.reject(new Error(event.data.error)); }
      else { callback.resolve(event.data.completion); }
      callbacksMap.delete(event.data.id);
    } else if (event.data.type === 'proxyFetchResponse') {
      const callback = callbacksMap.get(event.data.id);
      if (!callback) return;
      if (event.data.error) {
        callback.reject(new Error(event.data.error));
        callbacksMap.delete(event.data.id);
      } else {
        callback.resolve({ status: event.data.status, statusText: event.data.statusText, headers: event.data.headers });
        if (!event.data.body) callbacksMap.delete(event.data.id);
      }
    } else if (event.data.type === 'proxyFetchStream') {
      const controller = streamControllers.get(event.data.channelId);
      if (controller) {
        if (event.data.error) {
          controller.error(new Error(event.data.error));
          streamControllers.delete(event.data.channelId);
        } else if (event.data.done) {
          controller.close();
          streamControllers.delete(event.data.channelId);
          const callback = Array.from(callbacksMap.entries()).find(([_, v]) => v.channelId === event.data.channelId);
          if (callback) callbacksMap.delete(callback[0]);
        } else if (event.data.chunk) {
          controller.enqueue(new Uint8Array(event.data.chunk));
        }
      }
    } else if (event.data.type === 'storageGet' || event.data.type === 'storageSet' ||
               event.data.type === 'storageDelete' || event.data.type === 'storageList') {
      const callback = callbacksMap.get(event.data.id);
      if (!callback) return;
      if (event.data.error) { callback.reject(new Error(event.data.error)); }
      else { callback.resolve(event.data.result); }
      callbacksMap.delete(event.data.id);
    }
  });

  window.addEventListener('click', (event) => {
    const isEl = event.target instanceof HTMLElement;
    if (!isEl) return;
    const linkEl = event.target.closest("a");
    if (!linkEl || !linkEl.href) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (linkEl.href.startsWith("blob-request:")) {
      const blob = getBlobFromURL(linkEl.href);
      if (!blob) return;
      void blob.arrayBuffer().then((data) => {
        realParent.postMessage({ type: "downloadFile", filename: linkEl.download, data, mimeType: blob.type || "application/octet-stream" });
      });
    } else if (linkEl.href.startsWith("data:")) {
      const [header, base64Data] = linkEl.href.split(",");
      const mimeMatch = header.match(/data:([^;]+)/);
      const mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream";
      const binaryString = atob(base64Data);
      const data = Uint8Array.from(binaryString, (c) => c.charCodeAt(0)).buffer;
      realParent.postMessage({ type: "downloadFile", filename: linkEl.download, data, mimeType });
    } else {
      let linkUrl;
      try { linkUrl = new URL(linkEl.href); } catch { return; }
      if (linkUrl.hostname === window.location.hostname) return;
      realParent.postMessage({ type: 'openExternal', href: linkEl.href }, '*');
    }
  });

  window.open = function (url) {
    realParent.postMessage({ type: "openExternal", href: url }, "*");
  };

  window.addEventListener('error', (event) => {
    realParent.postMessage({ type: 'console', message: 'Uncaught Error: ' + event.message }, '*');
  });
})();`;

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

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.13/html-to-image.min.js" integrity="sha512-iZ2ORl595Wx6miw+GuadDet4WQbdSWS3JLMoNfY8cRGoEFy6oT3G9IbcrBeL6AfkgpA51ETt/faX6yLV+/gFJg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script>${CLAUDE_BRIDGE_SCRIPT}</script>
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
