import { useCallback, useEffect, useRef, useState } from "react";
import type { ArtifactPhase } from "./phase.js";

export interface ArtifactLifecycle {
  phase: ArtifactPhase;
  error: Error | undefined;
  setPhase: (phase: ArtifactPhase, error?: Error) => void;
}

export function useArtifactLifecycle(): ArtifactLifecycle {
  const [phase, setPhaseState] = useState<ArtifactPhase>("loading");
  const [error, setError] = useState<Error | undefined>(undefined);

  const setPhase = useCallback((next: ArtifactPhase, err?: Error) => {
    setPhaseState(next);
    setError(err);
  }, []);

  return { phase, error, setPhase };
}

export function useArtifactPhase(): ArtifactPhase {
  return useArtifactLifecycle().phase;
}

export interface StartArtifactConfig {
  onReady?: () => void | Promise<void>;
  onError?: (error: Error) => void;
}

export function useStartArtifact(config: StartArtifactConfig, lifecycle: ArtifactLifecycle): void {
  const configRef = useRef(config);
  configRef.current = config;
  const setPhase = lifecycle.setPhase;

  useEffect(() => {
    // fallow-ignore-next-line complexity
    const run = async () => {
      try {
        await configRef.current.onReady?.();
        setPhase("ready");
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setPhase("error", error);
        configRef.current.onError?.(error);
      }
    };
    void run();
  }, [setPhase]);
}
