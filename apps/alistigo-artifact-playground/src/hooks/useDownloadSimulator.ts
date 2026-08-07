import type { RefObject } from "react";
import { useCallback, useEffect, useState } from "react";

export type DownloadLogEntry = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  timestamp: number;
};

export function useDownloadSimulator(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  enabled: boolean,
) {
  const [logs, setLogs] = useState<DownloadLogEntry[]>([]);

  // fallow-ignore-next-line code-duplication
  const clearLogs = useCallback(() => setLogs([]), []);

  useEffect(() => {
    if (!enabled) return;

    // fallow-ignore-next-line complexity
    function handle(event: MessageEvent) {
      const win = iframeRef.current?.contentWindow;
      if (!win || event.source !== win) return;
      const msg = event.data as {
        type: string;
        filename?: string;
        data?: ArrayBuffer;
        mimeType?: string;
      };
      if (msg.type !== "downloadFile") return;

      const filename = msg.filename ?? "download";
      const data = msg.data ?? new ArrayBuffer(0);
      const mimeType = msg.mimeType ?? "application/octet-stream";

      setLogs((prev) => [
        {
          id: crypto.randomUUID(),
          filename,
          mimeType,
          sizeBytes: data.byteLength,
          timestamp: Date.now(),
        },
        ...prev,
      ]);

      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [iframeRef, enabled]);

  return { logs, clearLogs };
}
