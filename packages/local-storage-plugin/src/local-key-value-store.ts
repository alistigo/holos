import type { KeyValueStore } from "@alistigo/artifact-plugin-api";
import { createLogger } from "@alistigo/logger";

const log = createLogger("alistigo:local-storage");

export class LocalKeyValueStore implements KeyValueStore {
  async get(key: string): Promise<unknown> {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return undefined;
      return JSON.parse(raw) as unknown;
    } catch (err) {
      log.error({ key, err }, "get failed");
      return undefined;
    }
  }

  async set(key: string, value: unknown): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      log.error({ key, err }, "set failed");
    }
  }

  async del(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      log.error({ key, err }, "del failed");
    }
  }

  async list(prefix = ""): Promise<string[]> {
    return Object.keys(localStorage).filter((k) => k.startsWith(prefix));
  }
}
