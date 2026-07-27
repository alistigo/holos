import type { ApiCallResult } from "@alistigo/ai-chat-async-api";
import type { RefObject } from "react";
import { useCallback, useEffect, useState } from "react";

export interface ApiCallEntry {
  id: string;
  action: string;
  params: Record<string, unknown>;
  status: "pending" | "success" | "error";
  error?: string;
  timestamp: number;
}

export function useApiSimulator(iframeRef: RefObject<HTMLIFrameElement | null>) {
  const [callLog, setCallLog] = useState<ApiCallEntry[]>([]);

  useEffect(() => {
    function handle(event: MessageEvent) {
      if ((event.data as { type?: string } | null)?.type !== "alistigo:api-calls-result") return;
      const win = iframeRef.current?.contentWindow;
      if (!win || event.source !== win) return;
      const results = (event.data as { calls: ApiCallResult[] }).calls;
      setCallLog((prev) => {
        const updated = [...prev];
        for (const result of results) {
          for (let i = updated.length - 1; i >= 0; i--) {
            const entry = updated[i];
            if (
              entry !== undefined &&
              entry.action === result.action &&
              entry.status === "pending"
            ) {
              updated[i] = {
                ...entry,
                status: result.status,
                ...(result.error !== undefined && { error: result.error }),
              };
              break;
            }
          }
        }
        return updated;
      });
    }
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [iframeRef]);

  const sendCall = useCallback(
    (action: string, params: Record<string, unknown>) => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      const entry: ApiCallEntry = {
        id: crypto.randomUUID(),
        action,
        params,
        status: "pending",
        timestamp: Date.now(),
      };
      setCallLog((prev) => [...prev, entry]);
      const tag = doc.createElement("api-calls");
      tag.textContent = JSON.stringify([{ action, params }]);
      doc.body.appendChild(tag);
    },
    [iframeRef],
  );

  return { callLog, sendCall };
}
