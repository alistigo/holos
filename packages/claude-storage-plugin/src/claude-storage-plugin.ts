import type { AlistigoPlugin } from "@alistigo/artifact-plugin-api";
import {
  ClaudeArtifactListRepository,
  isClaudeArtifactContext,
  withStorageTimeout,
} from "./claude-artifact-list-repository.js";
import pkg from "../package.json" with { type: "json" };

const claudeStoragePlugin: AlistigoPlugin = {
  name: "@alistigo/claude-storage-plugin",
  version: pkg.version,
  type: "storage",
  storage: {
    isAvailable(): boolean {
      return isClaudeArtifactContext();
    },
    createStore() {
      return new ClaudeArtifactListRepository();
    },
    async listKeys(prefix = ""): Promise<Array<{ key: string; value: string }>> {
      const storage = window.storage;
      if (!storage) return [];
      try {
        // window.storage.list() returns ClaudeStorageListResult { keys: string[], prefix?, shared }
        // — not an array of {key,value}. Fetch each value individually.
        const result = await withStorageTimeout(storage.list(prefix));
        if (!result) return [];
        const entries = await Promise.all(
          result.keys.map(async (key) => {
            try {
              const item = await withStorageTimeout(storage.get(key));
              return { key, value: item.value };
            } catch {
              return null;
            }
          }),
        );
        return entries.filter((e): e is { key: string; value: string } => e !== null);
      } catch {
        return [];
      }
    },
  },
};

export default claudeStoragePlugin;
