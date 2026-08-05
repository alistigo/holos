import type { AlistigoPlugin } from "@alistigo/artifact-plugin-api";
import pkg from "../package.json" with { type: "json" };
import { ClaudeKeyValueStore, isClaudeArtifactContext } from "./claude-key-value-store.js";
import { withStorageRetry } from "./retry.js";

const claudeStoragePlugin: AlistigoPlugin = {
  name: "@alistigo/claude-storage-plugin",
  version: pkg.version,
  type: "storage",
  storage: {
    isAvailable(): boolean {
      return isClaudeArtifactContext();
    },
    createStore() {
      return new ClaudeKeyValueStore();
    },
    async listKeys(prefix = ""): Promise<Array<{ key: string; value: string }>> {
      const storage = window.storage;
      if (!storage) return [];
      try {
        const result = await withStorageRetry(() => storage.list(prefix));
        if (!result) return [];
        const entries = await Promise.all(
          result.keys.map(async (key) => {
            try {
              const item = await withStorageRetry(() => storage.get(key));
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
