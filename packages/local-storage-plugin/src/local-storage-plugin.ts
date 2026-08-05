import type { AlistigoPlugin } from "@alistigo/artifact-plugin-api";
import pkg from "../package.json" with { type: "json" };
import { LocalKeyValueStore } from "./local-key-value-store.js";

const localStoragePlugin: AlistigoPlugin = {
  name: "@alistigo/local-storage-plugin",
  version: pkg.version,
  type: "storage",
  storage: {
    isAvailable(): boolean {
      try {
        localStorage.setItem("__alistigo_probe__", "1");
        localStorage.removeItem("__alistigo_probe__");
        return true;
      } catch {
        return false;
      }
    },
    createStore() {
      return new LocalKeyValueStore();
    },
    async listKeys(prefix = ""): Promise<Array<{ key: string; value: string }>> {
      return Object.entries(localStorage)
        .filter(([k]) => k.startsWith(prefix))
        .map(([key, value]) => ({ key, value }));
    },
  },
};

export default localStoragePlugin;
