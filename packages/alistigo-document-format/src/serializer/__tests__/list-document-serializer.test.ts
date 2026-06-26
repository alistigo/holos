import { describe, expect, it } from "bun:test";
import { createListElementContent, generateActorId, List } from "@alistigo/domain";
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
