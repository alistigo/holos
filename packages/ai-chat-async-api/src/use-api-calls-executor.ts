import { useEffect } from "react";
import { ApiCallsExecutor } from "./executor.js";
import type { ActionHandlers, ArtifactApiDefinition } from "./types.js";

export function useApiCallsExecutor(
  definition: ArtifactApiDefinition,
  handlers: ActionHandlers,
): void {
  // biome-ignore lint/correctness/useExhaustiveDependencies: execute on mount only
  useEffect(() => {
    const executor = new ApiCallsExecutor(definition, handlers);
    void executor.execute();
  }, []);
}
