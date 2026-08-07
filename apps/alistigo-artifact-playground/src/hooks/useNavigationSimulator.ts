import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { useLogs } from "./useLogs";

export type NavLogEntry = {
  id: string;
  href: string;
  timestamp: number;
};

export function useNavigationSimulator(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  enabled: boolean,
) {
  const { logs, setLogs, clearLogs } = useLogs<NavLogEntry>();
  const [autoOpen, setAutoOpen] = useState(false);
  const autoOpenRef = useRef(autoOpen);
  autoOpenRef.current = autoOpen;

  useEffect(() => {
    if (!enabled) return;

    // fallow-ignore-next-line complexity
    function handle(event: MessageEvent) {
      const win = iframeRef.current?.contentWindow;
      if (!win || event.source !== win) return;
      const msg = event.data as { type: string; href?: string };
      if (msg.type !== "openExternal") return;

      const href = msg.href ?? "";
      setLogs((prev) => [{ id: crypto.randomUUID(), href, timestamp: Date.now() }, ...prev]);

      if (autoOpenRef.current) {
        window.open(href, "_blank", "noopener,noreferrer");
      }
    }

    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [iframeRef, enabled, setLogs]);

  return { logs, clearLogs, autoOpen, setAutoOpen };
}
