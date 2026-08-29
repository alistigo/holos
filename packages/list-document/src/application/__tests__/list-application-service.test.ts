import { describe, expect, test } from "bun:test";
import type { ListId } from "@alistigo/list-domain";
import {
  generateActorId,
  generateListId,
  type List,
  parseListElementId,
} from "@alistigo/list-domain";
import { ListDocumentSerializer } from "../../serializer/list-document-serializer.js";
import type { AlistigoDocument } from "../../types.js";
import { type AlistigoListStore, ListApplicationService } from "../list-application-service.js";

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

  async saveDocument(doc: AlistigoDocument): Promise<void> {
    this.docs.set(doc["@id"], doc);
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
    expect(doc["@id"]).toBe(listId.toString());
    expect(doc.name).toBe("My List");
    expect(doc.itemListElement).toHaveLength(0);
    expect(doc["alistigo:eventLog"]).toHaveLength(1);
    expect(doc["alistigo:eventLog"][0]?.["alistigo:eventType"]).toBe("ListCreated");
  });

  test("createList generates a listId when none is provided", async () => {
    const store = new InMemoryStore();
    const service = new ListApplicationService(store);

    const result = await service.createList(actorId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value["@id"]).toMatch(/^lst_/);
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
    expect(doc["alistigo:eventLog"]).toHaveLength(2); // ListCreated + ListElementAdded
    expect(doc["alistigo:eventLog"][1]?.["alistigo:eventType"]).toBe("ListElementAdded");
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
    expect(deleteResult.value["alistigo:eventLog"]).toHaveLength(3); // Created + Added + Deleted
  });

  test("loadDocument is read-only and adds no events", async () => {
    const store = new InMemoryStore();
    const service = new ListApplicationService(store);
    const listId = generateListId();

    await service.createList(actorId, undefined, listId);
    const doc = await service.loadDocument(listId);

    if (doc == null) throw new Error("expected doc to be defined");
    expect(doc["alistigo:eventLog"]).toHaveLength(1); // still just ListCreated
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
    const lastEvent = result.value["alistigo:eventLog"].at(-1);
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
    expect(doc["alistigo:eventLog"]).toHaveLength(3); // Created + 2 Added
  });

  // fallow-ignore-next-line complexity
  test("applyAiInitialInput: groceries list — title and items parsed correctly", async () => {
    const store = new InMemoryStore();
    const service = new ListApplicationService(store);
    const markdown = "Groceries:\n- Buy bread\n- Buy milk\n- Buy eggs";

    const result = await service.applyAiInitialInput(markdown, actorId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const doc = result.value;
    expect(doc["@type"]).toBe("ItemList");
    expect(doc.name).toBe("Groceries");
    expect(doc.itemListElement).toHaveLength(3);
    expect(doc.itemListElement[0]?.name).toBe("Buy bread");
    expect(doc.itemListElement[1]?.name).toBe("Buy milk");
    expect(doc.itemListElement[2]?.name).toBe("Buy eggs");
    expect(doc["alistigo:eventLog"]).toHaveLength(4); // Created + 3 Added
  });

  test("applyAiInitialInput: items only — no title, no name on doc", async () => {
    const store = new InMemoryStore();
    const service = new ListApplicationService(store);
    const markdown = "- Item one\n- Item two\n- Item three";

    const result = await service.applyAiInitialInput(markdown, actorId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBeUndefined();
    expect(result.value.itemListElement.map((i) => i.name)).toEqual([
      "Item one",
      "Item two",
      "Item three",
    ]);
  });

  test("applyAiInitialInput: ordered list markers are supported", async () => {
    const store = new InMemoryStore();
    const service = new ListApplicationService(store);
    const markdown = "Steps:\n1. First step\n2. Second step\n3. Third step";

    const result = await service.applyAiInitialInput(markdown, actorId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe("Steps");
    expect(result.value.itemListElement.map((i) => i.name)).toEqual([
      "First step",
      "Second step",
      "Third step",
    ]);
  });

  test("applyAiInitialInput: asterisk list markers are supported", async () => {
    const store = new InMemoryStore();
    const service = new ListApplicationService(store);
    const markdown = "Shopping:\n* Apples\n* Bananas";

    const result = await service.applyAiInitialInput(markdown, actorId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe("Shopping");
    expect(result.value.itemListElement.map((i) => i.name)).toEqual(["Apples", "Bananas"]);
  });

  test("applyAiInitialInput: title-only markdown creates an empty list", async () => {
    const store = new InMemoryStore();
    const service = new ListApplicationService(store);
    const markdown = "Empty list:";

    const result = await service.applyAiInitialInput(markdown, actorId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe("Empty list");
    expect(result.value.itemListElement).toHaveLength(0);
  });

  test("applyAiInitialInput: duplicates are preserved", async () => {
    const store = new InMemoryStore();
    const service = new ListApplicationService(store);
    const markdown = "Duplicates allowed:\n- Buy bread\n- Buy bread\n- Buy milk";

    const result = await service.applyAiInitialInput(markdown, actorId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.itemListElement).toHaveLength(3);
    expect(result.value.itemListElement[0]?.name).toBe("Buy bread");
    expect(result.value.itemListElement[1]?.name).toBe("Buy bread");
  });

  test("applyAiInitialInput: persists so subsequent load sees all elements", async () => {
    const store = new InMemoryStore();
    const service = new ListApplicationService(store);
    const markdown = "My List:\n- Alpha\n- Beta";
    const listId = generateListId();

    await service.applyAiInitialInput(markdown, actorId, listId);

    const loaded = await store.load(listId);
    if (loaded == null) throw new Error("expected list to be loaded");
    expect(loaded.elements).toHaveLength(2);
    expect(String(loaded.elements[0]?.content)).toBe("Alpha");
    expect(String(loaded.elements[1]?.content)).toBe("Beta");
  });

  test("applyAiInitialInput: uses provided listId", async () => {
    const store = new InMemoryStore();
    const service = new ListApplicationService(store);
    const listId = generateListId();
    const markdown = "List:\n- Item";

    const result = await service.applyAiInitialInput(markdown, actorId, listId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value["@id"]).toBe(listId.toString());
  });

  test("applyAiInitialInput: bullet with no text is silently ignored (empty list created)", async () => {
    const store = new InMemoryStore();
    const service = new ListApplicationService(store);
    const markdown = "List:\n- ";

    const result = await service.applyAiInitialInput(markdown, actorId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe("List");
    expect(result.value.itemListElement).toHaveLength(0);
  });
});
