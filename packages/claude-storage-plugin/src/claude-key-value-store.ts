import type { KeyValueStore } from "@alistigo/artifact-plugin-api";
import { artifactContext, type ClaudeStorage } from "@alistigo/claude-artifact-api";
import { createLogger } from "@alistigo/logger";
import { withStorageRetry } from "./retry.js";

const log = createLogger("alistigo:claude-storage");

export class ClaudeKeyValueStore implements KeyValueStore {
  private get storage(): ClaudeStorage {
    const s = (window as Window).storage;
    if (!s)
      throw new Error(
        "ClaudeKeyValueStore requires window.storage — check isClaudeArtifactContext() first",
      );
    return s;
  }

  async get(key: string): Promise<unknown> {
    if (!artifactContext().published) {
      throw new Error(
        "Storage reads are unavailable in draft mode — publish the artifact and open it via its public URL.",
      );
    }
    try {
      log.debug({ key }, "get");
      const result = await withStorageRetry(() => this.storage.get(key));
      return JSON.parse(result.value) as unknown;
    } catch (err) {
      log.debug({ key, err }, "get returned nothing (key may not exist)");
      return undefined;
    }
  }

  async set(key: string, value: unknown): Promise<void> {
    if (!artifactContext().published) {
      throw new Error(
        "Storage writes are unavailable in draft mode — publish the artifact and open it via its public URL.",
      );
    }
    log.debug({ key }, "set");
    await withStorageRetry(() => this.storage.set(key, JSON.stringify(value)));
  }

  async del(key: string): Promise<void> {
    if (!artifactContext().published) {
      throw new Error(
        "Storage deletes are unavailable in draft mode — publish the artifact and open it via its public URL.",
      );
    }
    log.debug({ key }, "del");
    await withStorageRetry(() => this.storage.delete(key));
  }

  async list(prefix = ""): Promise<string[]> {
    if (!artifactContext().published) {
      throw new Error(
        "Storage reads are unavailable in draft mode — publish the artifact and open it via its public URL.",
      );
    }
    try {
      log.debug({ prefix }, "list");
      const result = await withStorageRetry(() => this.storage.list(prefix));
      return result?.keys ?? [];
    } catch {
      return [];
    }
  }
}

/** Returns true when running inside a Claude artifact that exposes window.claude */
export function isClaudeArtifactContext(): boolean {
  return typeof window !== "undefined" && typeof window.claude?.complete === "function";
}
