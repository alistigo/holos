import { describe, expect, it } from "bun:test";
import { createListElementContent, generateActorId, List } from "@alistigo/list-domain";
import type { AlistigoActorRecord, AlistigoListElementCheckedRecord } from "../../types.js";
import { validateDocument } from "../../validate.js";
import { ListDocumentSerializer, SCHEMA_VERSION } from "../list-document-serializer.js";

const actorId = generateActorId();

describe("ListDocumentSerializer.serialize", () => {
  it("serializes a freshly created list to a valid document with 0 elements", () => {
    const { list } = List.create({ actorId });
    const doc = ListDocumentSerializer.serialize(list);

    expect(doc["@type"]).toBe("ItemList");
    expect(doc["alistigo:listId"]).toBe(list.id.toString());
    expect(doc["alistigo:schemaVersion"]).toBe(SCHEMA_VERSION);
    expect(doc.itemListElement).toHaveLength(0);
    expect(doc["alistigo:listEventLog"]).toHaveLength(1);
    expect(doc["alistigo:listEventLog"][0]?.["alistigo:eventType"]).toBe("ListCreated");
  });

  // fallow-ignore-next-line complexity
  it("serializes a list after addListElement with 1 element", () => {
    const { list } = List.create({ actorId });
    list.addListElement({ actorId, listId: list.id, content: createListElementContent("Milk") });
    const doc = ListDocumentSerializer.serialize(list);

    expect(doc.itemListElement).toHaveLength(1);
    expect(doc.itemListElement[0]?.["@type"]).toBe("ListItem");
    expect(doc.itemListElement[0]?.name).toBe("Milk");
    expect(doc.itemListElement[0]?.position).toBe(1);
    expect(doc["alistigo:listEventLog"]).toHaveLength(2);
    expect(doc["alistigo:listEventLog"][1]?.["alistigo:eventType"]).toBe("ListElementAdded");
  });

  it("appends new uncommitted events to an existing log when previousDocument is provided", () => {
    const { list } = List.create({ actorId });
    const firstDoc = ListDocumentSerializer.serialize(list);
    list.markEventsAsCommitted();

    list.addListElement({ actorId, listId: list.id, content: createListElementContent("Eggs") });
    const secondDoc = ListDocumentSerializer.serialize(list, firstDoc);

    expect(secondDoc["alistigo:listEventLog"]).toHaveLength(2);
    expect(secondDoc["alistigo:listEventLog"][0]?.["alistigo:eventType"]).toBe("ListCreated");
    expect(secondDoc["alistigo:listEventLog"][1]?.["alistigo:eventType"]).toBe("ListElementAdded");
  });

  it("includes title as name when list has a title", () => {
    const { list } = List.create({ actorId, title: "Groceries" });
    const doc = ListDocumentSerializer.serialize(list);
    expect(doc.name).toBe("Groceries");
  });

  it("omits name when list has no title", () => {
    const { list } = List.create({ actorId });
    const doc = ListDocumentSerializer.serialize(list);
    expect(doc.name).toBeUndefined();
  });

  it("writes alistigo:actors to the document when actorsById option is provided", () => {
    const { list } = List.create({ actorId });
    const actor: AlistigoActorRecord = {
      "alistigo:actorId": actorId.toString(),
      "alistigo:userId": "user-123",
      "alistigo:pseudo": "alice",
      "alistigo:avatar": "data:image/svg+xml;base64,PHN2Zy8+",
    };
    const actorsById = new Map([[actorId.toString(), actor]]);

    const doc = ListDocumentSerializer.serialize(list, undefined, { actorsById });

    expect(doc["alistigo:actors"]).toHaveLength(1);
    expect(doc["alistigo:actors"]?.[0]?.["alistigo:pseudo"]).toBe("alice");
  });

  it("upserts an existing actor by actorId when previousDocument already has actors", () => {
    const { list } = List.create({ actorId });
    const originalActor: AlistigoActorRecord = {
      "alistigo:actorId": actorId.toString(),
      "alistigo:userId": "user-123",
      "alistigo:pseudo": "alice",
      "alistigo:avatar": "data:image/svg+xml;base64,PHN2Zy8+",
    };
    const firstDoc = ListDocumentSerializer.serialize(list, undefined, {
      actorsById: new Map([[actorId.toString(), originalActor]]),
    });
    list.markEventsAsCommitted();

    const updatedActor: AlistigoActorRecord = {
      ...originalActor,
      "alistigo:pseudo": "alice-updated",
    };
    const secondDoc = ListDocumentSerializer.serialize(list, firstDoc, {
      actorsById: new Map([[actorId.toString(), updatedActor]]),
    });

    // There should still be exactly one actor (upsert, not append)
    expect(secondDoc["alistigo:actors"]).toHaveLength(1);
    expect(secondDoc["alistigo:actors"]?.[0]?.["alistigo:pseudo"]).toBe("alice-updated");
  });

  it("preserves actors from previousDocument when no actorsById option is provided", () => {
    const { list } = List.create({ actorId });
    const actor: AlistigoActorRecord = {
      "alistigo:actorId": actorId.toString(),
      "alistigo:userId": "user-123",
      "alistigo:pseudo": "alice",
      "alistigo:avatar": "data:image/svg+xml;base64,PHN2Zy8+",
    };
    const firstDoc = ListDocumentSerializer.serialize(list, undefined, {
      actorsById: new Map([[actorId.toString(), actor]]),
    });
    list.markEventsAsCommitted();

    list.addListElement({ actorId, listId: list.id, content: createListElementContent("Item") });
    const secondDoc = ListDocumentSerializer.serialize(list, firstDoc);

    // Actors should be preserved even without actorsById option
    expect(secondDoc["alistigo:actors"]).toHaveLength(1);
    expect(secondDoc["alistigo:actors"]?.[0]?.["alistigo:pseudo"]).toBe("alice");
  });

  it("preserves alistigo:metadatas from previousDocument items through serialize", () => {
    const { list } = List.create({ actorId });
    const addEvent = list.addListElement({
      actorId,
      listId: list.id,
      content: createListElementContent("Task"),
    });
    const firstDoc = ListDocumentSerializer.serialize(list);

    // Manually inject metadatas onto the item (simulating what a plugin would store)
    const elementId = addEvent.listElementId.toString();
    const firstDocWithMetadatas = {
      ...firstDoc,
      itemListElement: firstDoc.itemListElement.map((item) =>
        item["alistigo:listElementId"] === elementId
          ? { ...item, "alistigo:metadatas": { checkbox: { checked: true } } }
          : item,
      ),
    };
    list.markEventsAsCommitted();

    const secondDoc = ListDocumentSerializer.serialize(list, firstDocWithMetadatas);

    const restoredItem = secondDoc.itemListElement.find(
      (item) => item["alistigo:listElementId"] === elementId,
    );
    expect(restoredItem?.["alistigo:metadatas"]).toEqual({ checkbox: { checked: true } });
  });

  it("ListElementChecked event in the log survives serialize (pass-through)", () => {
    const { list } = List.create({ actorId });
    const addEvent = list.addListElement({
      actorId,
      listId: list.id,
      content: createListElementContent("Buy milk"),
    });
    const firstDoc = ListDocumentSerializer.serialize(list);
    list.markEventsAsCommitted();

    // Inject a ListElementChecked record into the previous document's log
    const checkedRecord: AlistigoListElementCheckedRecord = {
      "alistigo:listEventId": "evt_checked_001",
      "alistigo:eventType": "ListElementChecked",
      "alistigo:listId": list.id.toString(),
      "alistigo:actorId": actorId.toString(),
      "alistigo:timestamp": new Date().toISOString(),
      "alistigo:listElementId": addEvent.listElementId.toString(),
      checked: true,
    };
    const docWithChecked = {
      ...firstDoc,
      "alistigo:listEventLog": [...firstDoc["alistigo:listEventLog"], checkedRecord],
    };

    const nextDoc = ListDocumentSerializer.serialize(list, docWithChecked);

    const foundChecked = nextDoc["alistigo:listEventLog"].find(
      (r) => r["alistigo:eventType"] === "ListElementChecked",
    );
    expect(foundChecked).toBeDefined();
    expect((foundChecked as AlistigoListElementCheckedRecord | undefined)?.checked).toBe(true);
  });
});

describe("ListDocumentSerializer.deserialize", () => {
  it("deserializes a serialized document to an equivalent list", () => {
    const { list } = List.create({ actorId });
    list.addListElement({ actorId, listId: list.id, content: createListElementContent("Apple") });
    const doc = ListDocumentSerializer.serialize(list);

    const restored = ListDocumentSerializer.deserialize(doc);

    expect(restored.id.toString()).toBe(list.id.toString());
    expect(restored.elements).toHaveLength(1);
    expect(restored.elements[0]?.content as string).toBe("Apple");
  });

  it("deserializes preserving deletion — deleted elements are absent", () => {
    const { list } = List.create({ actorId });
    const addEvent = list.addListElement({
      actorId,
      listId: list.id,
      content: createListElementContent("To delete"),
    });
    list.addListElement({ actorId, listId: list.id, content: createListElementContent("Keep") });
    list.deleteListElement({ actorId, listId: list.id, listElementId: addEvent.listElementId });

    const doc = ListDocumentSerializer.serialize(list);
    const restored = ListDocumentSerializer.deserialize(doc);

    expect(restored.elements).toHaveLength(1);
    expect(restored.elements[0]?.content as string).toBe("Keep");
  });

  it("deserializes a document containing ListElementChecked records without error", () => {
    const { list } = List.create({ actorId });
    const addEvent = list.addListElement({
      actorId,
      listId: list.id,
      content: createListElementContent("Item"),
    });
    const doc = ListDocumentSerializer.serialize(list);

    const checkedRecord: AlistigoListElementCheckedRecord = {
      "alistigo:listEventId": "evt_checked_002",
      "alistigo:eventType": "ListElementChecked",
      "alistigo:listId": list.id.toString(),
      "alistigo:actorId": actorId.toString(),
      "alistigo:timestamp": new Date().toISOString(),
      "alistigo:listElementId": addEvent.listElementId.toString(),
      checked: false,
    };
    const docWithChecked = {
      ...doc,
      "alistigo:listEventLog": [...doc["alistigo:listEventLog"], checkedRecord],
    };

    // Should not throw; ListElementChecked is skipped during rehydration
    const restored = ListDocumentSerializer.deserialize(docWithChecked);
    expect(restored.elements).toHaveLength(1);
  });
});

describe("ListDocumentSerializer round-trip", () => {
  it("deserialize(serialize(list)) produces same elements", () => {
    const { list } = List.create({ actorId, title: "Round-trip" });
    list.addListElement({ actorId, listId: list.id, content: createListElementContent("One") });
    list.addListElement({ actorId, listId: list.id, content: createListElementContent("Two") });

    const doc = ListDocumentSerializer.serialize(list);
    const restored = ListDocumentSerializer.deserialize(doc);

    expect(restored.id.toString()).toBe(list.id.toString());
    expect(restored.title).toBe("Round-trip");
    expect(restored.elements).toHaveLength(2);
    expect(restored.elements[0]?.content as string).toBe("One");
    expect(restored.elements[1]?.content as string).toBe("Two");
  });

  it("round-trip produces no uncommitted events", () => {
    const { list } = List.create({ actorId });
    list.addListElement({ actorId, listId: list.id, content: createListElementContent("Item") });

    const doc = ListDocumentSerializer.serialize(list);
    const restored = ListDocumentSerializer.deserialize(doc);

    expect(restored.getUncommittedEvents()).toHaveLength(0);
  });
});

describe("JSON schema validation", () => {
  it("a list item with alistigo:metadatas passes schema validation", async () => {
    const { list } = List.create({ actorId });
    list.addListElement({ actorId, listId: list.id, content: createListElementContent("Task") });
    const doc = ListDocumentSerializer.serialize(list);

    const docWithMetadatas = {
      ...doc,
      itemListElement: doc.itemListElement.map((item) => ({
        ...item,
        "alistigo:metadatas": { checkbox: { checked: false } },
      })),
    };

    const result = await validateDocument(docWithMetadatas);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("a document with alistigo:actors passes schema validation", async () => {
    const { list } = List.create({ actorId });
    const actor: AlistigoActorRecord = {
      "alistigo:actorId": actorId.toString(),
      "alistigo:userId": "user-123",
      "alistigo:pseudo": "alice",
      "alistigo:avatar": "data:image/svg+xml;base64,PHN2Zy8+",
    };
    const doc = ListDocumentSerializer.serialize(list, undefined, {
      actorsById: new Map([[actorId.toString(), actor]]),
    });

    const result = await validateDocument(doc);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("a document with ListElementChecked in the event log passes schema validation", async () => {
    const { list } = List.create({ actorId });
    const addEvent = list.addListElement({
      actorId,
      listId: list.id,
      content: createListElementContent("Buy milk"),
    });
    const doc = ListDocumentSerializer.serialize(list);

    const checkedRecord: AlistigoListElementCheckedRecord = {
      "alistigo:listEventId": "evt_checked_003",
      "alistigo:eventType": "ListElementChecked",
      "alistigo:listId": list.id.toString(),
      "alistigo:actorId": actorId.toString(),
      "alistigo:timestamp": new Date().toISOString(),
      "alistigo:listElementId": addEvent.listElementId.toString(),
      checked: true,
    };
    const docWithChecked = {
      ...doc,
      "alistigo:listEventLog": [...doc["alistigo:listEventLog"], checkedRecord],
    };

    const result = await validateDocument(docWithChecked);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
