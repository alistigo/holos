import type { KeyValueStore } from "@alistigo/artifact-plugin-api";
import type { AlistigoListStore } from "@alistigo/list-document-editor";
import type { AlistigoDocument } from "@alistigo/list-document-format";
import { ListDocumentSerializer } from "@alistigo/list-document-format";
import type { List, ListId } from "@alistigo/list-domain";

export class ListKeyValueAdapter implements AlistigoListStore {
  constructor(private readonly store: KeyValueStore) {}

  async load(id: ListId): Promise<List | undefined> {
    const doc = await this.loadDocument(id);
    if (doc === undefined) return undefined;
    return ListDocumentSerializer.deserialize(doc);
  }

  async save(list: List): Promise<void> {
    const prev = await this.loadDocument(list.id);
    const doc = ListDocumentSerializer.serialize(list, prev);
    await this.store.set(list.id.toString(), doc);
  }

  async loadDocument(id: ListId): Promise<AlistigoDocument | undefined> {
    const raw = await this.store.get(id.toString());
    if (raw === undefined || raw === null) return undefined;
    return raw as AlistigoDocument;
  }

  async seedIfEmpty(document: AlistigoDocument): Promise<void> {
    const listId = document["alistigo:listId"];
    const keys = await this.store.list(listId);
    if (keys.length === 0) {
      await this.store.set(listId, document);
    }
  }
}
