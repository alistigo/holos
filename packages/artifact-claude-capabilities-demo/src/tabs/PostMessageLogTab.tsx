import type { JSX } from "react";
import { useEffect, useReducer, useState } from "react";

type Direction = "in" | "out";

type LogEntry = {
  id: string;
  direction: Direction;
  timestamp: Date;
  messageType: string;
  source?: string;
  payload: unknown;
};

// Module-level singleton — survives tab switches because React unmounts/remounts tabs.
// Messages accumulate for the lifetime of the page regardless of which tab is active.
const LOG: LogEntry[] = [];
const SUBSCRIBERS = new Set<() => void>();
let CAPTURING = false;

function addEntry(entry: LogEntry): void {
  LOG.unshift(entry);
  for (const fn of SUBSCRIBERS) fn();
}

// fallow-ignore-next-line complexity
function handleClickCapture(event: MouseEvent): void {
  const el = event.target;
  if (!(el instanceof Element)) return;
  const anchor = el.closest("a");
  if (!anchor) return;

  const href = anchor.getAttribute("href") ?? "";
  if (anchor.hasAttribute("download") && (href.startsWith("blob:") || href.startsWith("data:"))) {
    addEntry({
      id: crypto.randomUUID(),
      direction: "out",
      timestamp: new Date(),
      messageType: "downloadFile",
      source: "a[download] click",
      payload: {
        type: "downloadFile",
        filename: anchor.download || null,
        href: href.startsWith("data:") ? `${href.slice(0, 64)}…` : href,
      },
    });
  } else if (
    anchor.target === "_blank" &&
    href &&
    !href.startsWith("#") &&
    !href.startsWith("javascript:")
  ) {
    addEntry({
      id: crypto.randomUUID(),
      direction: "out",
      timestamp: new Date(),
      messageType: "openExternal",
      source: "a[target=_blank] click",
      payload: { type: "openExternal", href },
    });
  }
}

// Capture download and link-based navigation clicks at module load — before any user
// interaction and before initCapture runs. The inject-script sends these via a captured
// realParent reference (not wrappable), so DOM click interception is the only hook.
document.addEventListener("click", handleClickCapture, true);

type WindowWithClaudeApis = typeof window & {
  claude?: { complete: (prompt: string) => Promise<string> };
  storage?: {
    get: (key: string, shared?: boolean) => Promise<unknown>;
    set: (key: string, value: unknown, shared?: boolean) => Promise<unknown>;
    delete: (key: string, shared?: boolean) => Promise<unknown>;
    list: (prefix?: string, shared?: boolean) => Promise<unknown>;
  };
};

// fallow-ignore-next-line complexity
function initCapture(): void {
  if (CAPTURING) return;
  CAPTURING = true;

  // Incoming: capture phase runs before the inject-script's own listener
  window.addEventListener(
    "message",
    // fallow-ignore-next-line complexity
    (event) => {
      const data: unknown = event.data;
      const msgType =
        data !== null && typeof data === "object" && "type" in data && typeof data.type === "string"
          ? data.type
          : "unknown";
      addEntry({
        id: crypto.randomUUID(),
        direction: "in",
        timestamp: new Date(),
        messageType: msgType,
        payload: data,
      });
    },
    true,
  );

  // Outgoing: wrap inject-script's high-level APIs so we can log the call.
  // The inject-script stores `realParent` as a closure, so patching window.parent.postMessage
  // does not intercept its sends. Wrapping the API functions is the only reliable hook.

  const w = window as WindowWithClaudeApis;

  if (typeof w.fetch === "function") {
    const origFetch = w.fetch.bind(window);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).fetch = (url: RequestInfo | URL, init: RequestInit = {}) => {
      addEntry({
        id: crypto.randomUUID(),
        direction: "out",
        timestamp: new Date(),
        messageType: "proxyFetch",
        source: "window.fetch()",
        payload: { type: "proxyFetch", url: String(url), init },
      });
      return origFetch(url, init);
    };
  }

  if (w.storage) {
    const s = w.storage;
    const origGet = s.get.bind(s);
    const origSet = s.set.bind(s);
    const origDelete = s.delete.bind(s);
    const origList = s.list.bind(s);

    s.get = (key, shared = false) => {
      addEntry({
        id: crypto.randomUUID(),
        direction: "out",
        timestamp: new Date(),
        messageType: "storageGet",
        source: "window.storage.get()",
        payload: { type: "storageGet", key, shared },
      });
      return origGet(key, shared);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).set = (key: string, value: unknown, shared = false) => {
      addEntry({
        id: crypto.randomUUID(),
        direction: "out",
        timestamp: new Date(),
        messageType: "storageSet",
        source: "window.storage.set()",
        payload: { type: "storageSet", key, value, shared },
      });
      return origSet(key as string, value as string, shared);
    };
    s.delete = (key, shared = false) => {
      addEntry({
        id: crypto.randomUUID(),
        direction: "out",
        timestamp: new Date(),
        messageType: "storageDelete",
        source: "window.storage.delete()",
        payload: { type: "storageDelete", key, shared },
      });
      return origDelete(key, shared);
    };
    s.list = (prefix = "", shared = false) => {
      addEntry({
        id: crypto.randomUUID(),
        direction: "out",
        timestamp: new Date(),
        messageType: "storageList",
        source: "window.storage.list()",
        payload: { type: "storageList", prefix, shared },
      });
      return origList(prefix, shared);
    };
  }

  if (w.claude?.complete) {
    const origComplete = w.claude.complete.bind(w.claude);
    w.claude.complete = (prompt) => {
      addEntry({
        id: crypto.randomUUID(),
        direction: "out",
        timestamp: new Date(),
        messageType: "claudeComplete",
        source: "window.claude.complete()",
        payload: { type: "claudeComplete", prompt },
      });
      return origComplete(prompt);
    };
  }

  if (typeof window.open === "function") {
    const origOpen = window.open.bind(window);
    window.open = (url?: string | URL | null, target?: string, features?: string) => {
      addEntry({
        id: crypto.randomUUID(),
        direction: "out",
        timestamp: new Date(),
        messageType: "openExternal",
        source: "window.open()",
        payload: {
          type: "openExternal",
          href: url !== null && url !== undefined ? String(url) : null,
        },
      });
      return origOpen(url ?? undefined, target, features);
    };
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatMs(date: Date): string {
  return String(date.getMilliseconds()).padStart(3, "0");
}

function tryPrettyJson(payload: unknown): string {
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

function DirectionBadge({ direction }: { direction: Direction }): JSX.Element {
  if (direction === "out") {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-blue-700">
        ↑ OUT
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700">
      ↓ IN
    </span>
  );
}

// fallow-ignore-next-line complexity
function EntryRow({ entry }: { entry: LogEntry }): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const pretty = tryPrettyJson(entry.payload);
  const isJson = entry.payload !== null && typeof entry.payload === "object";

  return (
    <div
      className={`rounded-lg border text-xs ${
        entry.direction === "out"
          ? "border-blue-200 bg-blue-50"
          : "border-emerald-200 bg-emerald-50"
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-black/5 focus:outline-none"
      >
        <span className="text-gray-400 text-[10px]">{expanded ? "▼" : "▶"}</span>
        <DirectionBadge direction={entry.direction} />
        <span className="font-mono text-gray-400">
          {formatTime(entry.timestamp)}
          <span className="text-gray-300">.{formatMs(entry.timestamp)}</span>
        </span>
        <span
          className={`font-semibold ${entry.direction === "out" ? "text-blue-800" : "text-emerald-800"}`}
        >
          {entry.messageType}
        </span>
        {entry.source && <span className="text-gray-400">via {entry.source}</span>}
        {!expanded && isJson && (
          <span className="ml-auto truncate max-w-48 text-gray-400 font-mono">
            {pretty.split("\n")[0]}
          </span>
        )}
      </button>

      {expanded && (
        <div className="border-t border-gray-200 px-3 pb-3 pt-2">
          <p className="mb-1 font-medium text-gray-500">
            {entry.direction === "out" ? "Sent to parent" : "Received from parent"}
          </p>
          <pre className="overflow-x-auto whitespace-pre rounded bg-white/70 p-2 font-mono text-xs text-gray-800">
            {pretty}
          </pre>
          <div className="mt-2 flex flex-wrap gap-4 text-gray-400">
            <span>
              <span className="font-medium text-gray-500">Time: </span>
              {entry.timestamp.toISOString()}
            </span>
            <span>
              <span className="font-medium text-gray-500">Type: </span>
              {entry.messageType}
            </span>
            {entry.source && (
              <span>
                <span className="font-medium text-gray-500">API: </span>
                {entry.source}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// fallow-ignore-next-line complexity
export function PostMessageLogTab(): JSX.Element {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    initCapture();
    SUBSCRIBERS.add(forceUpdate);
    return () => {
      SUBSCRIBERS.delete(forceUpdate);
    };
    // forceUpdate from useReducer is stable — no deps needed
    // biome-ignore lint/correctness/useExhaustiveDependencies: stable reducer dispatch
  }, []);

  function clearLog(): void {
    LOG.length = 0;
    forceUpdate();
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-gray-200 px-4 py-2 flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            postMessage bridge log
          </p>
          <p className="text-xs text-gray-400">
            <span className="inline-flex items-center gap-1">
              <span className="rounded bg-blue-100 px-1 font-mono text-[10px] font-semibold text-blue-700">
                ↑ OUT
              </span>
              artifact → parent
            </span>
            <span className="mx-2 text-gray-300">·</span>
            <span className="inline-flex items-center gap-1">
              <span className="rounded bg-emerald-100 px-1 font-mono text-[10px] font-semibold text-emerald-700">
                ↓ IN
              </span>
              parent → artifact
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {LOG.length} message{LOG.length !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={clearLog}
            className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 focus:outline-none"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {LOG.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <p className="text-sm text-gray-400">No messages yet.</p>
            <p className="text-xs text-gray-400 max-w-sm">
              Use any other tab — Storage, AI, API Calls, File Generation, or External Navigation —
              and the postMessage traffic will appear here in real time.
            </p>
          </div>
        )}
        {LOG.map((entry) => (
          <EntryRow key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
