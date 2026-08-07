import type { JSX } from "react";
import { useState } from "react";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type CallEntry =
  | { id: string; url: string; method: string; status: "pending" }
  | {
      id: string;
      url: string;
      method: string;
      status: "result";
      statusCode: number;
      responseText: string;
    }
  | { id: string; url: string; method: string; status: "error"; error: string };

const HAS_BODY: HttpMethod[] = ["POST", "PUT", "PATCH"];

function Spinner(): JSX.Element {
  return (
    <svg
      className="h-4 w-4 animate-spin text-blue-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function ApiCallsTab(): JSX.Element {
  const [url, setUrl] = useState("https://httpbin.org/get");
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [headers, setHeaders] = useState<{ id: string; key: string; value: string }[]>([]);
  const [body, setBody] = useState("");
  const [entries, setEntries] = useState<CallEntry[]>([]);

  function addHeader(): void {
    setHeaders((prev) => [...prev, { id: crypto.randomUUID(), key: "", value: "" }]);
  }

  function removeHeader(id: string): void {
    setHeaders((prev) => prev.filter((h) => h.id !== id));
  }

  function updateHeader(id: string, field: "key" | "value", val: string): void {
    setHeaders((prev) => prev.map((h) => (h.id === id ? { ...h, [field]: val } : h)));
  }

  // fallow-ignore-next-line complexity
  async function handleSubmit(): Promise<void> {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    const id = crypto.randomUUID();
    setEntries((prev) => [{ id, url: trimmedUrl, method, status: "pending" }, ...prev]);

    try {
      const headerMap = Object.fromEntries(
        headers.filter((h) => h.key.trim()).map((h) => [h.key.trim(), h.value]),
      );
      const res = await fetch(trimmedUrl, {
        method,
        headers: headerMap,
        ...(HAS_BODY.includes(method) && body ? { body } : {}),
      });
      const text = await res.text();
      const truncated = text.length > 2000 ? `${text.slice(0, 2000)}\n… (truncated)` : text;
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                id,
                url: trimmedUrl,
                method,
                status: "result",
                statusCode: res.status,
                responseText: truncated,
              }
            : e,
        ),
      );
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id ? { id, url: trimmedUrl, method, status: "error", error } : e,
        ),
      );
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-gray-200 p-4 space-y-3">
        <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
          window.fetch (proxied network request)
        </p>

        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            className="rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            {(["GET", "POST", "PUT", "PATCH", "DELETE"] as HttpMethod[]).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        {headers.length > 0 && (
          <div className="space-y-2">
            {headers.map((h) => (
              <div key={h.id} className="flex gap-2">
                <input
                  type="text"
                  value={h.key}
                  onChange={(e) => updateHeader(h.id, "key", e.target.value)}
                  placeholder="Header name"
                  className="w-40 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={h.value}
                  onChange={(e) => updateHeader(h.id, "value", e.target.value)}
                  placeholder="Value"
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeHeader(h.id)}
                  className="rounded px-2 text-gray-400 hover:text-red-500 focus:outline-none"
                  aria-label="Remove header"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {HAS_BODY.includes(method) && (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Request body…"
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none"
          />
        )}

        <div className="flex gap-3">
          <button
            type="button"
            disabled={!url.trim()}
            onClick={() => {
              void handleSubmit();
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none"
          >
            Send
          </button>
          <button
            type="button"
            onClick={addHeader}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 focus:outline-none"
          >
            + Header
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {entries.length === 0 && (
          <p className="text-center text-sm text-gray-400">Responses will appear here.</p>
        )}
        {/* fallow-ignore-next-line complexity */}
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <p className="mb-2 text-xs font-medium text-gray-500">
              {entry.method} <span className="font-mono text-gray-800">{entry.url}</span>
            </p>
            {entry.status === "pending" && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Spinner /> Sending…
              </div>
            )}
            {entry.status === "result" && (
              <>
                <p
                  className={`mb-2 text-sm font-semibold ${entry.statusCode < 400 ? "text-green-600" : "text-red-600"}`}
                >
                  HTTP {entry.statusCode}
                </p>
                <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded bg-gray-50 p-2 font-mono text-xs text-gray-700">
                  {entry.responseText}
                </pre>
              </>
            )}
            {entry.status === "error" && (
              <p className="text-sm text-red-600">Error: {entry.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
