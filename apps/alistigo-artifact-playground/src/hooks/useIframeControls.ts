import { useCallback, useRef, useState } from "react";

export function useIframeControls() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // reloadKey forces a full iframe remount (key change = unmount + mount)
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const clearData = useCallback(async () => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.localStorage.clear();
    }
    reload();
  }, [reload]);

  return { iframeRef, reloadKey, reload, clearData };
}
