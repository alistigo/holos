import type { AlistigoDocument } from "@alistigo/list-document";
import { ListDocumentSerializer } from "@alistigo/list-document";
import type { AlistigoListStore } from "@alistigo/list-document";
import type { List, ListId } from "@alistigo/list-domain";

export class InMemoryListStore implements AlistigoListStore {
  private readonly docs = new Map<string, AlistigoDocument>();

  async load(id: ListId): Promise<List | undefined> {
    const doc = this.docs.get(id.toString());
    if (doc === undefined) return undefined;
    return ListDocumentSerializer.deserialize(doc);
  }

  async save(list: List): Promise<void> {
    const prev = this.docs.get(list.id.toString());
    const doc = ListDocumentSerializer.serialize(list, prev);
    this.docs.set(list.id.toString(), doc);
  }

  async loadDocument(id: ListId): Promise<AlistigoDocument | undefined> {
    return this.docs.get(id.toString());
  }

  // fallow-ignore-next-line unused-class-member
  async saveDocument(doc: AlistigoDocument): Promise<void> {
    this.docs.set(doc.identifier, doc);
  }
}
