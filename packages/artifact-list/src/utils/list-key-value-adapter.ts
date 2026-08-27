import type { KeyValueStore } from "@alistigo/artifact-plugin-api";
import type { AlistigoAgentRecord, AlistigoDocument } from "@alistigo/list";
import { ListDocumentSerializer } from "@alistigo/list";
import type { AlistigoListStore } from "@alistigo/list-document-editor";
import type { List, ListId } from "@alistigo/list-domain";

// An artifact holds at most one list document. Using a fixed key decouples
// persistence from listId, which is regenerated on every markdown parse.
const DOCUMENT_KEY = "document";

export class ListKeyValueAdapter implements AlistigoListStore {
  /** Mutable reference to the current actors map, updated by the host via setActorsById. */
  private actorsById: Map<string, AlistigoAgentRecord> | undefined;

  constructor(private readonly store: KeyValueStore) {}

  /** Called by the host whenever the actor registry changes (e.g. on user:changed). */
  // fallow-ignore-next-line unused-class-member
  setActorsById(actorsById: Map<string, AlistigoAgentRecord>): void {
    this.actorsById = actorsById;
  }

  async load(_id: ListId): Promise<List | undefined> {
    const doc = await this.loadDocument(_id);
    if (doc === undefined) return undefined;
    return ListDocumentSerializer.deserialize(doc);
  }

  async save(list: List): Promise<void> {
    const prev = await this.loadDocument(list.id);
    const doc = ListDocumentSerializer.serialize(list, prev, {
      ...(this.actorsById !== undefined ? { actorsById: this.actorsById } : {}),
    });
    await this.store.set(DOCUMENT_KEY, doc);
  }

  async loadDocument(_id: ListId): Promise<AlistigoDocument | undefined> {
    const raw = await this.store.get(DOCUMENT_KEY);
    if (raw === undefined || raw === null) return undefined;
    return raw as AlistigoDocument;
  }

  // fallow-ignore-next-line unused-class-member
  async saveDocument(doc: AlistigoDocument): Promise<void> {
    await this.store.set(DOCUMENT_KEY, doc);
  }

  // fallow-ignore-next-line unused-class-member
  async seedIfEmpty(document: AlistigoDocument): Promise<void> {
    const existing = await this.store.get(DOCUMENT_KEY);
    if (existing == null) {
      await this.store.set(DOCUMENT_KEY, document);
    }
  }
}
