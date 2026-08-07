import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export type AiLogEntry = {
  id: string;
  prompt: string;
  response: string;
  status: "pending" | "done" | "error";
  timestamp: number;
};

// fallow-ignore-next-line complexity
export function useClaudeCompleteSimulator(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  enabled: boolean,
  delayMs: number,
) {
  const [cannedResponse, setCannedResponse] = useState(
    "This is a simulated claude.complete() response from the playground.",
  );
  const [errorMode, setErrorMode] = useState(false);
  const [logs, setLogs] = useState<AiLogEntry[]>([]);

  const delayMsRef = useRef(delayMs);
  delayMsRef.current = delayMs;
  const cannedRef = useRef(cannedResponse);
  cannedRef.current = cannedResponse;
  const errorRef = useRef(errorMode);
  errorRef.current = errorMode;

  // fallow-ignore-next-line code-duplication
  const clearLogs = useCallback(() => setLogs([]), []);

  useEffect(() => {
    if (!enabled) return;

    // fallow-ignore-next-line complexity
    function handle(event: MessageEvent) {
      const win = iframeRef.current?.contentWindow;
      if (!win || event.source !== win) return;
      const msg = event.data as { type: string; id?: string; prompt?: string };
      if (msg.type !== "claudeComplete") return;

      const id = msg.id ?? "";
      const prompt = msg.prompt ?? "";
      setLogs((prev) => [
        { id, prompt, response: "", status: "pending", timestamp: Date.now() },
        ...prev,
      ]);

      function respond(w: Window) {
        if (errorRef.current) {
          w.postMessage(
            { type: "claudeComplete", id, error: "Simulated error from playground" },
            "*",
          );
          setLogs((prev) =>
            prev.map((e) =>
              e.id === id ? { ...e, status: "error", response: "Simulated error" } : e,
            ),
          );
        } else {
          const completion = cannedRef.current;
          w.postMessage({ type: "claudeComplete", id, completion }, "*");
          setLogs((prev) =>
            prev.map((e) => (e.id === id ? { ...e, status: "done", response: completion } : e)),
          );
        }
      }

      const delay = delayMsRef.current;
      if (delay > 0) setTimeout(() => respond(win), delay);
      else respond(win);
    }

    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [iframeRef, enabled]);

  return { logs, clearLogs, cannedResponse, setCannedResponse, errorMode, setErrorMode };
}
