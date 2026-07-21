import type { RefObject } from "react";
import { useCallback, useEffect, useRef } from "react";

type StorageReply = { result: unknown; error?: string };
type OpParams = { key: string; value: string; prefix: string };
type OpHandler = (map: Map<string, string>, params: OpParams) => StorageReply;

const OPS: Record<string, OpHandler> = {
  storageGet(map, { key }) {
    const v = map.get(key);
    return v === undefined
      ? { result: undefined, error: "Key not found" }
      : { result: { value: v } };
  },
  storageSet(map, { key, value }) {
    map.set(key, value);
    return { result: null };
  },
  storageDelete(map, { key }) {
    map.delete(key);
    return { result: null };
  },
  storageList(map, { prefix }) {
    return {
      result: Array.from(map.entries())
        .filter(([k]) => k.startsWith(prefix))
        .map(([k, v]) => ({ key: k, value: v })),
    };
  },
};

function applyStorageOp(
  type: string,
  map: Map<string, string>,
  key = "",
  value = "",
  prefix = "",
): StorageReply | null {
  const handler = OPS[type];
  if (!handler) return null;
  return handler(map, { key, value, prefix });
}

export function useClaudeStorageSimulator(iframeRef: RefObject<HTMLIFrameElement | null>) {
  const storeRef = useRef(new Map<string, string>());
  const sharedRef = useRef(new Map<string, string>());

  const clearStorage = useCallback(() => {
    storeRef.current.clear();
    sharedRef.current.clear();
  }, []);

  useEffect(() => {
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
      const op = applyStorageOp(type, map, key, value, prefix);
      if (op) win.postMessage({ type, id, ...op }, "*");
    }

    function handle(event: MessageEvent) {
      const win = iframeRef.current?.contentWindow;
      if (!win || event.source !== win) return;
      processStorageMessage(event, win);
    }

    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [iframeRef]);

  return { clearStorage };
}
