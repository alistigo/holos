import { useEffect, useState } from "react";

declare global {
  interface Window {
    __alistigoDebugTriggerRenderError?: () => void;
  }
}

/**
 * Dev/test-only escape hatch: forces a descendant render throw on demand so
 * the host's ArtifactErrorBoundary -> "error:uncaught" bus path is
 * exercisable in E2E tests without needing a real bug. Inert unless
 * explicitly invoked via window.__alistigoDebugTriggerRenderError().
 */
export default function DebugRenderErrorTrigger(): null {
  const [shouldThrow, setShouldThrow] = useState(false);

  useEffect(() => {
    window.__alistigoDebugTriggerRenderError = () => setShouldThrow(true);
    return () => {
      delete window.__alistigoDebugTriggerRenderError;
    };
  }, []);

  if (shouldThrow) throw new Error("Alistigo debug-triggered render error");
  return null;
}
