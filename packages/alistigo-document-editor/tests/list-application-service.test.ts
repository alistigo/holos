import { describe, expect, test } from "bun:test";
import type { AlistigoDocument } from "@alistigo/document-format";
import { ListDocumentSerializer } from "@alistigo/document-format";
import type { ListId } from "@alistigo/domain";
import { generateActorId, generateListId, type List, parseListElementId } from "@alistigo/domain";
import {
  type AlistigoListStore,
  ListApplicationService,
} from "../src/application/list-application-service.js";

class InMemoryStore implements AlistigoListStore {
  private docs = new Map<string, AlistigoDocument>();

  async load(id: ListId): Promise<List | undefined> {
    const doc = this.docs.get(id.toString());
    return doc ? ListDocumentSerializer.deserialize(doc) : undefined;
  }

  async save(list: List): Promise<void> {
    const prev = this.docs.get(list.id.toString());
    this.docs.set(list.id.toString(), ListDocumentSerializer.serialize(list, prev));
  }

  async loadDocument(id: ListId): Promise<AlistigoDocument | undefined> {
    return this.docs.get(id.toString());
  }
}

const actorId = generateActorId();

describe("ListApplicationService", () => {
  test("createList returns a valid AlistigoDocument", async () => {
    const store = new InMemoryStore();
    const service = new ListApplicationService(store);
    const listId = generateListId();

    const result = await service.createList(actorId, "My List", listId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const doc = result.value;
    expect(doc["@type"]).toBe("ItemList");
    expect(doc["alistigo:listId"]).toBe(listId.toString());
    expect(doc.name).toBe("My List");
    expect(doc.itemListElement).toHaveLength(0);
    expect(doc["alistigo:listEventLog"]).toHaveLength(1);
    expect(doc["alistigo:listEventLog"][0]?.["alistigo:eventType"]).toBe("ListCreated");
  });

  test("createList generates a listId when none is provided", async () => {
    const store = new InMemoryStore();
    const service = new ListApplicationService(store);

    const result = await service.createList(actorId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value["alistigo:listId"]).toMatch(/^lst_/);
  });

  // fallow-ignore-next-line complexity
  test("addListElement appends an element and grows the event log", async () => {
    const store = new InMemoryStore();
    const service = new ListApplicationService(store);
    const listId = generateListId();

    await service.createList(actorId, undefined, listId);
    const result = await service.addListElement(listId, "Buy bread", actorId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const doc = result.value;
    expect(doc.itemListElement).toHaveLength(1);
    expect(doc.itemListElement[0]?.name).toBe("Buy bread");
    expect(doc.itemListElement[0]?.position).toBe(1);
    expect(doc["alistigo:listEventLog"]).toHaveLength(2); // ListCreated + ListElementAdded
    expect(doc["alistigo:listEventLog"][1]?.["alistigo:eventType"]).toBe("ListElementAdded");
  });

  test("addListElement persists so a subsequent load sees the element", async () => {
    const store = new InMemoryStore();
    const service = new ListApplicationService(store);
    const listId = generateListId();

    await service.createList(actorId, undefined, listId);
    await service.addListElement(listId, "Buy bread", actorId);

    const loaded = await store.load(listId);
    if (loaded == null) throw new Error("expected list to be loaded");
    expect(loaded.elements).toHaveLength(1);
    expect(String(loaded.elements[0]?.content)).toBe("Buy bread");
  });

  test("deleteListElement removes the element from the document", async () => {
    const store = new InMemoryStore();
    const service = new ListApplicationService(store);
    const listId = generateListId();

    await service.createList(actorId, undefined, listId);
    const addResult = await service.addListElement(listId, "Buy bread", actorId);
    expect(addResult.ok).toBe(true);
    if (!addResult.ok) return;

    const firstItem = addResult.value.itemListElement[0];
    if (firstItem == null) throw new Error("expected first item");
    const elementId = parseListElementId(firstItem["alistigo:listElementId"]);
    const deleteResult = await service.deleteListElement(listId, elementId, actorId);

    expect(deleteResult.ok).toBe(true);
    if (!deleteResult.ok) return;
    expect(deleteResult.value.itemListElement).toHaveLength(0);
    expect(deleteResult.value["alistigo:listEventLog"]).toHaveLength(3); // Created + Added + Deleted
  });

  test("loadDocument is read-only and adds no events", async () => {
    const store = new InMemoryStore();
    const service = new ListApplicationService(store);
    const listId = generateListId();

    await service.createList(actorId, undefined, listId);
    const doc = await service.loadDocument(listId);

    if (doc == null) throw new Error("expected doc to be defined");
    expect(doc["alistigo:listEventLog"]).toHaveLength(1); // still just ListCreated
  });

  test("loadDocument returns undefined for an unknown listId", async () => {
    const service = new ListApplicationService(new InMemoryStore());
    const doc = await service.loadDocument(generateListId());
    expect(doc).toBeUndefined();
  });

  test("exportListDocument emits a ListExported audit event", async () => {
    const store = new InMemoryStore();
    const service = new ListApplicationService(store);
    const listId = generateListId();

    await service.createList(actorId, undefined, listId);
    const result = await service.exportListDocument(listId, actorId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const lastEvent = result.value["alistigo:listEventLog"].at(-1);
    expect(lastEvent?.["alistigo:eventType"]).toBe("ListExported");
    // Export is audit-only — no element changes
    expect(result.value.itemListElement).toHaveLength(0);
  });

  test("addListElement on unknown listId returns err", async () => {
    const service = new ListApplicationService(new InMemoryStore());
    const result = await service.addListElement(generateListId(), "Buy bread", actorId);
    expect(result.ok).toBe(false);
  });

  test("addListElement with empty content returns err", async () => {
    const store = new InMemoryStore();
    const service = new ListApplicationService(store);
    const listId = generateListId();

    await service.createList(actorId, undefined, listId);
    const result = await service.addListElement(listId, "   ", actorId);
    expect(result.ok).toBe(false);
  });

  test("deleteListElement on unknown element returns err", async () => {
    const store = new InMemoryStore();
    const service = new ListApplicationService(store);
    const listId = generateListId();

    await service.createList(actorId, undefined, listId);
    const unknownElementId = parseListElementId(
      generateListId().toString().replace("lst_", "lse_"),
    );
    const result = await service.deleteListElement(listId, unknownElementId, actorId);
    expect(result.ok).toBe(false);
  });

  test("round-trip: serialize/deserialize preserves state across reloads", async () => {
    const store = new InMemoryStore();
    const service = new ListApplicationService(store);
    const listId = generateListId();

    await service.createList(actorId, "Shopping", listId);
    await service.addListElement(listId, "Apples", actorId);
    await service.addListElement(listId, "Bananas", actorId);

    const doc = await service.loadDocument(listId);
    if (doc == null) throw new Error("expected doc to be defined");
    expect(doc.itemListElement.map((i) => i.name)).toEqual(["Apples", "Bananas"]);
    expect(doc.name).toBe("Shopping");
    expect(doc["alistigo:listEventLog"]).toHaveLength(3); // Created + 2 Added
  });
});
