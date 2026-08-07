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
              description="The inject-script replaces window.fetch with a postMessage bridge that proxies HTTP requests through the parent Claude frame. Supports all methods, custom headers, request bodies, and streaming responses via ReadableStream chunks. The tab lets you fire requests and watch the response stream in real time using httpbingo.org test endpoints."
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
            The last tab shows the full source of the bridge script Claude silently prepends to
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
      </div>
    </div>
  );
}
