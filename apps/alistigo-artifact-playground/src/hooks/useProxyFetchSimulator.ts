import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export type FetchLogEntry = {
  id: string;
  url: string;
  method: string;
  status: "pending" | "done" | "error";
  statusCode?: number;
  error?: string;
  timestamp: number;
};

// fallow-ignore-next-line complexity
export function useProxyFetchSimulator(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  enabled: boolean,
  delayMs: number,
) {
  const [logs, setLogs] = useState<FetchLogEntry[]>([]);
  const delayMsRef = useRef(delayMs);
  delayMsRef.current = delayMs;

  const clearLogs = useCallback(() => setLogs([]), []);

  useEffect(() => {
    if (!enabled) return;

    // fallow-ignore-next-line complexity
    async function proxyFetch(event: MessageEvent, win: Window): Promise<void> {
      const { id, url, init, channelId } = event.data as {
        id: string;
        url: string;
        init: RequestInit;
        channelId: string;
      };

      setLogs((prev) => [
        {
          id,
          url,
          method: String(init.method ?? "GET"),
          status: "pending",
          timestamp: Date.now(),
        },
        ...prev,
      ]);

      try {
        const res = await fetch(url, init);
        const headers: Record<string, string> = {};
        res.headers.forEach((v, k) => {
          headers[k] = v;
        });

        win.postMessage(
          {
            type: "proxyFetchResponse",
            id,
            status: res.status,
            statusText: res.statusText,
            headers,
          },
          "*",
        );
        setLogs((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: "done", statusCode: res.status } : e)),
        );

        if (res.body) {
          const reader = res.body.getReader();
          try {
            for (;;) {
              const { done, value } = await reader.read();
              if (done) {
                win.postMessage({ type: "proxyFetchStream", channelId, done: true }, "*");
                break;
              }
              win.postMessage(
                { type: "proxyFetchStream", channelId, chunk: Array.from(value) },
                "*",
              );
            }
          } catch (streamErr) {
            win.postMessage({ type: "proxyFetchStream", channelId, error: String(streamErr) }, "*");
          }
        } else {
          win.postMessage({ type: "proxyFetchStream", channelId, done: true }, "*");
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        win.postMessage({ type: "proxyFetchResponse", id, error }, "*");
        setLogs((prev) => prev.map((e) => (e.id === id ? { ...e, status: "error", error } : e)));
      }
    }

    // fallow-ignore-next-line complexity
    function handle(event: MessageEvent) {
      const win = iframeRef.current?.contentWindow;
      if (!win || event.source !== win) return;
      const { type } = event.data as { type: string };
      if (type !== "proxyFetch") return;

      const delay = delayMsRef.current;
      if (delay > 0) {
        setTimeout(() => void proxyFetch(event, win), delay);
      } else {
        void proxyFetch(event, win);
      }
    }

    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [iframeRef, enabled]);

  return { logs, clearLogs };
}
