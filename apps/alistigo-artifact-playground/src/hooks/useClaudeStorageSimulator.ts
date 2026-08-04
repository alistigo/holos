import type { RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type StorageReply = { result: unknown; error?: string };
type OpParams = { key: string; value: string; prefix: string; shared: boolean };
type OpHandler = (map: Map<string, string>, params: OpParams) => StorageReply;

const OPS: Record<string, OpHandler> = {
  storageGet(map, { key, shared }) {
    const v = map.get(key);
    return v === undefined
      ? { result: undefined, error: "Key not found" }
      : { result: { key, value: v, shared, "@type": "ClaudeStorageResult" } };
  },
  storageSet(map, { key, value, shared }) {
    map.set(key, value);
    return { result: { key, value, shared, "@type": "ClaudeStorageResult" } };
  },
  storageDelete(map, { key, shared }) {
    if (!map.has(key)) {
      return { result: undefined, error: "Key not found" };
    }
    map.delete(key);
    return { result: { key, deleted: true, shared, "@type": "ClaudeStorageDeleteResult" } };
  },
  storageList(map, { prefix, shared }) {
    return {
      result: {
        keys: Array.from(map.keys()).filter((k) => k.startsWith(prefix)),
        prefix,
        shared,
        "@type": "ClaudeStorageListResult",
      },
    };
  },
};

const WRITE_OPS = new Set(["storageSet", "storageDelete"]);

function applyStorageOp(
  type: string,
  map: Map<string, string>,
  key = "",
  value = "",
  prefix = "",
  shared = false,
): StorageReply | null {
  const handler = OPS[type];
  if (!handler) return null;
  return handler(map, { key, value, prefix, shared });
}

export function useClaudeStorageSimulator(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  enabled: boolean,
  delayMs: number,
) {
  const storeRef = useRef(new Map<string, string>());
  const sharedRef = useRef(new Map<string, string>());
  const [storageVersion, setStorageVersion] = useState(0);
  // Store delay in a ref so the event handler always reads the latest value
  // without needing to re-register on every delay change
  const delayMsRef = useRef(delayMs);
  delayMsRef.current = delayMs;

  const clearStorage = useCallback(() => {
    if (!enabled) return;
    storeRef.current.clear();
    sharedRef.current.clear();
    setStorageVersion((v) => v + 1);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    function processStorageMessage(event: MessageEvent, win: Window) {
      const { type, id, key, value, prefix, shared } = event.data as {
        type: string;
        id: string;
        key?: string;
        value?: string;
        prefix?: string;
        shared?: boolean;
      };
      const map = shared ? sharedRef.current : storeRef.current;
      const op = applyStorageOp(type, map, key, value, prefix, shared ?? false);
      if (op) {
        win.postMessage({ type, id, ...op }, "*");
        if (WRITE_OPS.has(type)) {
          setStorageVersion((v) => v + 1);
        }
      }
    }

    // fallow-ignore-next-line complexity
    function handle(event: MessageEvent) {
      const win = iframeRef.current?.contentWindow;
      if (!win || event.source !== win) return;
      const delay = delayMsRef.current;
      if (delay > 0) {
        setTimeout(() => processStorageMessage(event, win), delay);
      } else {
        processStorageMessage(event, win);
      }
    }

    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [iframeRef, enabled]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: storageVersion is an intentional trigger dep — storeRef.current is a mutable map that doesn't re-render on its own
  const storeEntries = useMemo(() => Array.from(storeRef.current.entries()), [storageVersion]);

  return { clearStorage, storeEntries };
}
