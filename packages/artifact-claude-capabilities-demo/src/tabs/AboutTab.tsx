import type { JSX } from "react";

function Capability({
  title,
  badge,
  description,
  note,
}: {
  title: string;
  badge: string;
  description: string;
  note?: string;
}): JSX.Element {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <span className="shrink-0 rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
          {badge}
        </span>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
      {note && <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">{note}</p>}
    </div>
  );
}

export function AboutTab(): JSX.Element {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mx-auto max-w-prose space-y-4">
        <div>
          <h1 className="text-base font-semibold text-gray-900">
            Claude Artifact Capabilities Demo
          </h1>
          <p className="mt-0.5 text-xs text-gray-400">
            @alistigo/artifact-claude-capabilities-demo
          </p>
        </div>

        <p className="text-sm text-gray-700">
          A self-contained demo artifact that exercises every API Claude injects into artifact
          iframes. Each tab demonstrates one capability with live interaction so you can verify the
          bridge works and observe how the parent frame handles each message type.
        </p>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Capabilities
          </p>
          <div className="space-y-2">
            <Capability
              title="Storage — window.storage"
              badge="Storage tab"
              description="A promise-based key-value store backed by the Claude conversation. Supports a private namespace (scoped to your artifact) and a shared namespace (available across all artifacts in the same conversation). Operations: get, set, delete, list. The tab provides a full browser: list keys by prefix, inspect JSON values, create, edit, and delete entries."
              note="Requires a published artifact. window.storage is unavailable in draft mode — the Storage tab is disabled until the artifact has a stable identity."
            />
            <Capability
              title="AI completions — window.claude.complete()"
              badge="AI tab"
              description="Sends a prompt to the Claude model that generated the artifact and returns the completion as a string. The call routes through a postMessage bridge and resolves when Claude replies. Useful for adding conversational or generative features directly inside an artifact without any external API key."
            />
            <Capability
              title="File generation — URL.createObjectURL / data: URI"
              badge="File Generation tab"
              description="Two download paths. The first uses URL.createObjectURL() with a Blob — the inject-script intercepts the blob-request:// URL and forwards the binary to the parent frame. The second encodes content as a data: URI (e.g. data:text/csv;base64,…) — the inject-script parses the MIME type and base64 payload inline with no Blob needed. Both paths trigger the browser's download flow."
            />
            <Capability
              title="Network proxy — window.fetch"
              badge="API Calls tab"
              description="The inject-script replaces window.fetch with a postMessage bridge that forwards HTTP requests to the parent Claude frame. The bridge supports all HTTP methods, custom headers, request bodies, and streaming responses via ReadableStream — but it is a mediation layer, not a general HTTP client. The parent frame only forwards requests to api.anthropic.com; all other origins fail with a NetworkError regardless of CORS headers or Capabilities domain settings. The API Calls tab lets you send requests and watch streaming responses in real time, with two deliberately blocked examples (httpbingo.org, api.github.com) showing the failure mode."
              note="Anthropic API only — arbitrary fetch to external origins is blocked. For external data, use the web_search tool or MCP connectors instead. Artifacts relying on window.fetch require an active Claude session and cannot be shared fully publicly."
            />
            <Capability
              title="External navigation — window.open / <a> links"
              badge="External Navigation tab"
              description="External links (href pointing to a different hostname) and window.open() calls are intercepted by the inject-script and forwarded to the parent frame as openExternal postMessages. The parent decides whether to open them in a new tab. Same-origin links pass through normally."
            />
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Usage</p>
          <p className="mb-2 text-sm text-gray-700">
            Paste into a Claude HTML artifact and open it in a conversation:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-green-300">
            {`<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-claude-capabilities-demo@0/dist/index.umd.js"></script>`}
          </pre>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Inject Script tab
          </p>
          <p className="text-sm text-gray-700">
            The seventh tab shows the full source of the bridge script Claude silently prepends to
            every artifact before it loads. It patches{" "}
            <code className="rounded bg-gray-100 px-1">window.storage</code>,{" "}
            <code className="rounded bg-gray-100 px-1">window.claude</code>,{" "}
            <code className="rounded bg-gray-100 px-1">window.fetch</code>,{" "}
            <code className="rounded bg-gray-100 px-1">window.open</code>, and{" "}
            <code className="rounded bg-gray-100 px-1">URL.createObjectURL</code> as postMessage
            bridges to the parent frame. Claude hides this script from the artifact's source view —
            it does not appear if you inspect the artifact source inside Claude's UI.
          </p>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            PostMessage Log tab
          </p>
          <p className="text-sm text-gray-700">
            The last tab captures every postMessage crossing the bridge in real time — both
            directions. Outgoing messages (artifact → parent) are color-coded blue{" "}
            <span className="inline rounded bg-blue-100 px-1 font-mono text-[10px] font-semibold text-blue-700">
              ↑ OUT
            </span>{" "}
            and incoming replies (parent → artifact) are green{" "}
            <span className="inline rounded bg-emerald-100 px-1 font-mono text-[10px] font-semibold text-emerald-700">
              ↓ IN
            </span>
            . Each row shows the message type, timestamp, and API source; click to expand the full
            JSON payload. The log uses a module-level singleton so messages accumulate regardless of
            which tab is active — useful for correlating what you triggered in one tab with the raw
            protocol visible here.
          </p>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-400">
            Built with the{" "}
            <span className="font-medium text-gray-500">alistigo framework for artifacts</span>. The
            full source — framework, plugins, and this demo — is available at{" "}
            <a
              href="https://github.com/alistigo/holos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              github.com/alistigo/holos
            </a>
            . Open source and free to use.
          </p>
        </div>
      </div>
    </div>
  );
}
