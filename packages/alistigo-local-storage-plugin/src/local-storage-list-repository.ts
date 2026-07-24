import type { AlistigoListStore } from "@alistigo/document-editor";
import type { AlistigoDocument } from "@alistigo/document-format";
import { ListDocumentSerializer } from "@alistigo/document-format";
import type { List, ListId } from "@alistigo/domain";
import { createLogger } from "@alistigo/logger";

const log = createLogger("alistigo:local-storage");
const key = (id: ListId): string => `alistigo:list:${id.toString()}`;

export class LocalStorageListRepository implements AlistigoListStore {
  async load(id: ListId): Promise<List | undefined> {
    try {
      const raw = localStorage.getItem(key(id));
      if (raw == null) return undefined;
      log.debug({ key: key(id) }, "loading from localStorage");
      const doc = JSON.parse(raw) as AlistigoDocument;
      return ListDocumentSerializer.deserialize(doc);
    } catch (err) {
      log.error({ err }, "failed to load from localStorage");
      return undefined;
    }
  }

  async save(list: List): Promise<void> {
    try {
      const prev = await this.loadDocument(list.id);
      const doc = ListDocumentSerializer.serialize(list, prev);
      localStorage.setItem(key(list.id), JSON.stringify(doc));
      log.debug({ key: key(list.id) }, "saved to localStorage");
    } catch (err) {
      log.error({ err }, "failed to save to localStorage");
    }
  }

  async loadDocument(id: ListId): Promise<AlistigoDocument | undefined> {
    try {
      const raw = localStorage.getItem(key(id));
      if (raw == null) return undefined;
      return JSON.parse(raw) as AlistigoDocument;
    } catch (err) {
      log.error({ err }, "failed to load document from localStorage");
      return undefined;
    }
  }

  /**
   * Writes `doc` to localStorage only if no document is stored for that listId.
   * Used by App to seed the initial document on first load without losing the
   * event log (a round-trip through serialize/deserialize would drop committed events).
   */
  // fallow-ignore-next-line unused-class-member
  async seedIfEmpty(doc: AlistigoDocument): Promise<void> {
    const storageKey = `alistigo:list:${doc["alistigo:listId"]}`;
    try {
      if (localStorage.getItem(storageKey) == null) {
        localStorage.setItem(storageKey, JSON.stringify(doc));
        log.info({ key: storageKey }, "document seeded (first run)");
      }
    } catch (err) {
      log.error({ err }, "failed to seed localStorage");
    }
  }
}
