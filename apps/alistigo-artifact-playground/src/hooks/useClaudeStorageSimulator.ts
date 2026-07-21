import type { RefObject } from "react";
import { useCallback, useEffect, useRef } from "react";

export function useClaudeStorageSimulator(iframeRef: RefObject<HTMLIFrameElement | null>) {
  const storeRef = useRef(new Map<string, string>());
  const sharedRef = useRef(new Map<string, string>());

  const clearStorage = useCallback(() => {
    storeRef.current.clear();
    sharedRef.current.clear();
  }, []);

  useEffect(() => {
    function handle(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const { type, id, key, value, prefix, shared } = event.data as {
        type: string;
        id: string;
        key?: string;
        value?: string;
        prefix?: string;
        shared?: boolean;
      };
      const map = shared ? sharedRef.current : storeRef.current;
      const win = iframeRef.current?.contentWindow;
      if (!win) return;

      function reply(result: unknown, error?: string) {
        win?.postMessage({ type, id, result, error }, "*");
      }

      if (type === "storageGet") {
        const v = map.get(key ?? "");
        if (v === undefined) reply(undefined, "Key not found");
        else reply({ value: v });
      } else if (type === "storageSet") {
        map.set(key ?? "", value ?? "");
        reply(null);
      } else if (type === "storageDelete") {
        map.delete(key ?? "");
        reply(null);
      } else if (type === "storageList") {
        const p = prefix ?? "";
        reply(
          Array.from(map.entries())
            .filter(([k]) => k.startsWith(p))
            .map(([k, v]) => ({ key: k, value: v })),
        );
      }
    }
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [iframeRef]);

  return { clearStorage };
}
