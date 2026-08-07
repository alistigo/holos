import type { JSX } from "react";
import { useState } from "react";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type CallEntry =
  | { id: string; url: string; method: string; status: "pending" }
  | {
      id: string;
      url: string;
      method: string;
      status: "streaming";
      statusCode: number;
      responseText: string;
    }
  | {
      id: string;
      url: string;
      method: string;
      status: "result";
      statusCode: number;
      responseText: string;
    }
  | { id: string; url: string; method: string; status: "error"; error: string };

type Example = {
  label: string;
  method: HttpMethod;
  url: string;
  body?: string;
  extraHeaders?: Record<string, string>;
};

const BASE = "https://httpbingo.org";

const EXAMPLES: { group: string; items: Example[] }[] = [
  {
    group: "Basic",
    items: [
      { label: "GET request info", method: "GET", url: `${BASE}/get` },
      { label: "Origin IP", method: "GET", url: `${BASE}/ip` },
      { label: "Random UUID", method: "GET", url: `${BASE}/uuid` },
      { label: "Inspect headers", method: "GET", url: `${BASE}/headers` },
      {
        label: "Echo POST body",
        method: "POST",
        url: `${BASE}/anything`,
        body: '{"hello":"world"}',
        extraHeaders: { "Content-Type": "application/json" },
      },
    ],
  },
  {
    group: "Status & delay",
    items: [
      { label: "200 OK", method: "GET", url: `${BASE}/status/200` },
      { label: "404 Not Found", method: "GET", url: `${BASE}/status/404` },
      { label: "500 Server Error", method: "GET", url: `${BASE}/status/500` },
      { label: "Delay 2 seconds", method: "GET", url: `${BASE}/delay/2` },
    ],
  },
  {
    group: "Streaming",
    items: [
      { label: "Stream 10 JSON lines", method: "GET", url: `${BASE}/stream/10` },
      {
        label: "Drip 200 bytes over 4s",
        method: "GET",
        url: `${BASE}/drip?numbytes=200&duration=4`,
      },
      { label: "Server-sent events / 5s", method: "GET", url: `${BASE}/sse?duration=5s` },
      { label: "JSONL 8 lines / 3s", method: "GET", url: `${BASE}/jsonl?count=8&duration=3s` },
    ],
  },
];

const HAS_BODY: HttpMethod[] = ["POST", "PUT", "PATCH"];

const METHOD_COLOR: Record<HttpMethod, string> = {
  GET: "text-green-600",
  POST: "text-blue-600",
  PUT: "text-amber-600",
  PATCH: "text-orange-600",
  DELETE: "text-red-600",
};

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

// fallow-ignore-next-line complexity
export function ApiCallsTab(): JSX.Element {
  const [url, setUrl] = useState(`${BASE}/get`);
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [headers, setHeaders] = useState<{ id: string; key: string; value: string }[]>([]);
  const [body, setBody] = useState("");
  const [entries, setEntries] = useState<CallEntry[]>([]);
  const [showExamples, setShowExamples] = useState(true);

  function applyExample(ex: Example): void {
    setMethod(ex.method);
    setUrl(ex.url);
    setBody(ex.body ?? "");
    setHeaders(
      ex.extraHeaders
        ? Object.entries(ex.extraHeaders).map(([key, value]) => ({
            id: crypto.randomUUID(),
            key,
            value,
          }))
        : [],
    );
  }

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

      setEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                id,
                url: trimmedUrl,
                method,
                status: "streaming",
                statusCode: res.status,
                responseText: "",
              }
            : e,
        ),
      );

      const reader = res.body?.getReader();
      if (!reader) {
        setEntries((prev) =>
          prev.map((e) =>
            e.id === id && e.status === "streaming" ? { ...e, status: "result" as const } : e,
          ),
        );
        return;
      }

      const decoder = new TextDecoder();
      let accumulated = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const display =
          accumulated.length > 4000 ? `${accumulated.slice(0, 4000)}\n… (truncated)` : accumulated;
        setEntries((prev) =>
          prev.map((e) =>
            e.id === id && e.status === "streaming" ? { ...e, responseText: display } : e,
          ),
        );
      }

      setEntries((prev) =>
        prev.map((e) =>
          e.id === id && e.status === "streaming" ? { ...e, status: "result" as const } : e,
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
      {/* Examples panel */}
      <div className="shrink-0 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setShowExamples((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-2 text-xs font-medium tracking-wide text-gray-500 uppercase hover:bg-gray-50"
        >
          Examples
          <span className="text-gray-400 text-[10px]">{showExamples ? "▲" : "▼"}</span>
        </button>
        {showExamples && (
          <div className="max-h-52 overflow-y-auto px-4 pb-3 space-y-2">
            {EXAMPLES.map((group) => (
              <div key={group.group}>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  {group.group}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((ex) => (
                    <button
                      key={ex.url}
                      type="button"
                      onClick={() => applyExample(ex)}
                      className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs text-left hover:bg-blue-50"
                    >
                      <span
                        className={`w-11 shrink-0 font-mono font-semibold ${METHOD_COLOR[ex.method]}`}
                      >
                        {ex.method}
                      </span>
                      <span className="truncate text-gray-700">{ex.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request builder */}
      <div className="shrink-0 border-b border-gray-200 p-4 space-y-3">
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

      {/* Response log */}
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
            {(entry.status === "streaming" || entry.status === "result") && (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <p
                    className={`text-sm font-semibold ${entry.statusCode < 400 ? "text-green-600" : "text-red-600"}`}
                  >
                    HTTP {entry.statusCode}
                  </p>
                  {entry.status === "streaming" && (
                    <div className="flex items-center gap-1 text-xs text-blue-500">
                      <Spinner /> streaming…
                    </div>
                  )}
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded bg-gray-50 p-2 font-mono text-xs text-gray-700">
                  {entry.responseText || (entry.status === "streaming" ? "…" : "(empty)")}
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
