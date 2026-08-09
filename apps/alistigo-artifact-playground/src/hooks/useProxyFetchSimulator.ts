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

const ANTHROPIC_ORIGIN = "https://api.anthropic.com";

function isStreamingRequest(init: RequestInit): boolean {
  if (typeof init.body !== "string") return false;
  try {
    const parsed = JSON.parse(init.body) as Record<string, unknown>;
    return parsed.stream === true;
  } catch {
    return false;
  }
}

function buildNonStreamingFixture(): string {
  return JSON.stringify({
    id: "msg_fixture_01",
    type: "message",
    role: "assistant",
    model: "claude-haiku-4-5-20251001",
    content: [
      {
        type: "text",
        text: "[Playground fixture] Simulated response. The real Anthropic API is not called in the playground.",
      },
    ],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 10, output_tokens: 20 },
  });
}

function buildStreamingFixture(): string {
  const textChunks = [
    "[Playground fixture] ",
    "Simulated streaming response.",
    " The real API is not called.",
  ];
  const lines = [
    `event: message_start\ndata: ${JSON.stringify({ type: "message_start", message: { id: "msg_fixture_01", type: "message", role: "assistant", content: [], model: "claude-haiku-4-5-20251001", stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 0 } } })}`,
    `event: content_block_start\ndata: ${JSON.stringify({ type: "content_block_start", index: 0, content_block: { type: "text", text: "" } })}`,
    `event: ping\ndata: {"type":"ping"}`,
    ...textChunks.map(
      (text) =>
        `event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text } })}`,
    ),
    `event: content_block_stop\ndata: ${JSON.stringify({ type: "content_block_stop", index: 0 })}`,
    `event: message_delta\ndata: ${JSON.stringify({ type: "message_delta", delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: textChunks.length } })}`,
    `event: message_stop\ndata: {"type":"message_stop"}`,
  ];
  return `${lines.join("\n\n")}\n\n`;
}

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
    function proxyFetch(event: MessageEvent, win: Window): void {
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

      if (!url.startsWith(`${ANTHROPIC_ORIGIN}/`)) {
        const error = "NetworkError — the playground only forwards requests to api.anthropic.com";
        win.postMessage({ type: "proxyFetchResponse", id, error }, "*");
        setLogs((prev) => prev.map((e) => (e.id === id ? { ...e, status: "error", error } : e)));
        return;
      }

      const streaming = isStreamingRequest(init);
      const body = streaming ? buildStreamingFixture() : buildNonStreamingFixture();
      const contentType = streaming ? "text/event-stream" : "application/json";

      win.postMessage(
        {
          type: "proxyFetchResponse",
          id,
          status: 200,
          statusText: "OK",
          headers: { "content-type": contentType },
        },
        "*",
      );
      setLogs((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: "done", statusCode: 200 } : e)),
      );

      const encoded = new TextEncoder().encode(body);
      win.postMessage({ type: "proxyFetchStream", channelId, chunk: Array.from(encoded) }, "*");
      win.postMessage({ type: "proxyFetchStream", channelId, done: true }, "*");
    }

    // fallow-ignore-next-line complexity
    function handle(event: MessageEvent) {
      const win = iframeRef.current?.contentWindow;
      if (!win || event.source !== win) return;
      const { type } = event.data as { type: string };
      if (type !== "proxyFetch") return;

      const delay = delayMsRef.current;
      if (delay > 0) {
        setTimeout(() => proxyFetch(event, win), delay);
      } else {
        proxyFetch(event, win);
      }
    }

    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [iframeRef, enabled]);

  return { logs, clearLogs };
}
