import type { AlistigoListStore } from "@alistigo/document-editor";
import type { AlistigoDocument } from "@alistigo/document-format";
import { ListDocumentSerializer } from "@alistigo/document-format";
import type { List, ListId } from "@alistigo/domain";
import { createLogger } from "@alistigo/logger";

const log = createLogger("alistigo:claude-storage");

const STORAGE_TIMEOUT_MS = 1000;

function withStorageTimeout<T>(p: Promise<T>): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Storage operation timed out")), STORAGE_TIMEOUT_MS),
    ),
  ]);
}

// Key format: no whitespace, no / \ ' " — TypeID format (alistigo-{listId}) is safe
// since TypeIDs use only alphanumeric chars and underscores.
const storageKey = (listId: ListId): string => `alistigo-${listId.toString()}`;

export class ClaudeArtifactListRepository implements AlistigoListStore {
  private get storage(): ClaudeStorage {
    const s = (window as Window).storage;
    if (!s)
      throw new Error(
        "ClaudeArtifactListRepository requires window.storage — use isClaudeArtifactContext() before instantiating",
      );
    return s;
  }

  async load(id: ListId): Promise<List | undefined> {
    try {
      log.debug({ key: storageKey(id) }, "loading from claude storage");
      const result = await withStorageTimeout(this.storage.get(storageKey(id)));
      const doc = JSON.parse(result.value) as AlistigoDocument;
      return ListDocumentSerializer.deserialize(doc);
    } catch (err) {
      // window.storage.get throws for non-existent keys — not an error worth logging
      log.debug({ err }, "load from claude storage returned nothing (key may not exist)");
      return undefined;
    }
  }

  async save(list: List): Promise<void> {
    const prev = await this.loadDocument(list.id);
    const doc = ListDocumentSerializer.serialize(list, prev);
    await withStorageTimeout(this.storage.set(storageKey(list.id), JSON.stringify(doc)));
    log.debug({ key: storageKey(list.id) }, "saved to claude storage");
  }

  async loadDocument(id: ListId): Promise<AlistigoDocument | undefined> {
    try {
      const result = await withStorageTimeout(this.storage.get(storageKey(id)));
      return JSON.parse(result.value) as AlistigoDocument;
    } catch (err) {
      log.debug({ err }, "loadDocument from claude storage returned nothing (key may not exist)");
      return undefined;
    }
  }
}

/** Returns true when running inside a Claude artifact that exposes window.claude */
export function isClaudeArtifactContext(): boolean {
  return typeof window !== "undefined" && typeof window.claude?.complete === "function";
}
