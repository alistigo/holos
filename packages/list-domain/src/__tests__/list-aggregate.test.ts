import { describe, expect, it } from "bun:test";
import { List } from "../aggregates/list.js";
import { ListElementNotFoundError, ListError } from "../errors/list-error.js";
import { generateActorId } from "../value-objects/actor-id.js";
import { createListElementContent } from "../value-objects/list-element-content.js";
import { generateListId } from "../value-objects/list-id.js";

// Helper: create a minimal actor id for tests
const actorId = generateActorId();

describe("List.create", () => {
  it("creates a List with generated ListId when none provided", () => {
    const { list, event } = List.create({ actorId });
    expect(list.id).toBeDefined();
    expect(list.id.getType()).toBe("lst");
    expect(event.type).toBe("ListCreated");
    expect(event.listId).toBe(list.id);
    expect(event.actorId).toBe(actorId);
  });

  it("creates a List with the provided ListId", () => {
    const listId = generateListId();
    const { list, event } = List.create({ actorId, listId });
    expect(list.id).toBe(listId);
    expect(event.listId).toBe(listId);
  });

  it("creates a List with title when provided", () => {
    const { list, event } = List.create({ actorId, title: "My List" });
    expect(list.title).toBe("My List");
    expect(event.title).toBe("My List");
  });

  it("creates a List with no title when none provided", () => {
    const { list } = List.create({ actorId });
    expect(list.title).toBeUndefined();
  });

  it("starts with an empty elements array", () => {
    const { list } = List.create({ actorId });
    expect(list.elements).toHaveLength(0);
  });

  it("has one uncommitted event after creation", () => {
    const { list } = List.create({ actorId });
    const events = list.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("ListCreated");
  });
});

describe("List.addListElement", () => {
  it("appends a new element and emits ListElementAdded", () => {
    const { list } = List.create({ actorId });
    const content = createListElementContent("Buy milk");
    const event = list.addListElement({ actorId, listId: list.id, content });

    expect(event.type).toBe("ListElementAdded");
    expect(event.content).toBe(content);
    expect(event.listElementId.getType()).toBe("lse");
    expect(list.elements).toHaveLength(1);
  });

  it("each element gets a unique ListElementId", () => {
    const { list } = List.create({ actorId });
    const content = createListElementContent("Item");
    const e1 = list.addListElement({ actorId, listId: list.id, content });
    const e2 = list.addListElement({ actorId, listId: list.id, content });

    expect(e1.listElementId.toString()).not.toBe(e2.listElementId.toString());
  });

  it("allows duplicate content (identity is not content-based)", () => {
    const { list } = List.create({ actorId });
    const content = createListElementContent("Duplicate");
    list.addListElement({ actorId, listId: list.id, content });
    list.addListElement({ actorId, listId: list.id, content });

    expect(list.elements).toHaveLength(2);
  });

  it("preserves insertion order", () => {
    const { list } = List.create({ actorId });
    const c1 = createListElementContent("First");
    const c2 = createListElementContent("Second");
    const c3 = createListElementContent("Third");
    list.addListElement({ actorId, listId: list.id, content: c1 });
    list.addListElement({ actorId, listId: list.id, content: c2 });
    list.addListElement({ actorId, listId: list.id, content: c3 });

    const elements = list.elements;
    expect(elements[0]?.content as string).toBe("First");
    expect(elements[1]?.content as string).toBe("Second");
    expect(elements[2]?.content as string).toBe("Third");
  });

  it("records addedAt timestamp on the element", () => {
    const { list } = List.create({ actorId });
    const content = createListElementContent("Item");
    const event = list.addListElement({ actorId, listId: list.id, content });

    const element = list.elements[0];
    expect(element?.addedAt).toBe(event.timestamp);
  });
});

describe("List.deleteListElement", () => {
  it("removes an element and emits ListElementDeleted", () => {
    const { list } = List.create({ actorId });
    const content = createListElementContent("To delete");
    const addEvent = list.addListElement({ actorId, listId: list.id, content });

    const deleteEvent = list.deleteListElement({
      actorId,
      listId: list.id,
      listElementId: addEvent.listElementId,
    });

    expect(deleteEvent.type).toBe("ListElementDeleted");
    expect(deleteEvent.listElementId).toBe(addEvent.listElementId);
    expect(list.elements).toHaveLength(0);
  });

  it("throws ListElementNotFoundError when listElementId does not exist", () => {
    const { list } = List.create({ actorId });
    const foreignId = generateListId();

    // Use a foreign TypeID cast as lse — the element simply won't exist
    const { list: list2 } = List.create({ actorId });
    const content = createListElementContent("Other");
    const addEvent = list2.addListElement({ actorId, listId: list2.id, content });

    // addEvent.listElementId is valid but belongs to list2, not list
    expect(() =>
      list.deleteListElement({
        actorId,
        listId: list.id,
        listElementId: addEvent.listElementId,
      }),
    ).toThrow(ListElementNotFoundError);
    // foreignId is ListId type, suppress lint; test just verifies error type above
    void foreignId;
  });

  it("does not allow reuse of a deleted ListElementId", () => {
    const { list } = List.create({ actorId });
    const content = createListElementContent("To delete");
    const addEvent = list.addListElement({ actorId, listId: list.id, content });
    list.deleteListElement({
      actorId,
      listId: list.id,
      listElementId: addEvent.listElementId,
    });

    // Trying to delete the same element again should throw
    expect(() =>
      list.deleteListElement({
        actorId,
        listId: list.id,
        listElementId: addEvent.listElementId,
      }),
    ).toThrow(ListElementNotFoundError);
  });
});

describe("List.exportListDocument", () => {
  it("emits ListExported event with json-ld format", () => {
    const { list } = List.create({ actorId });
    const event = list.exportListDocument({ actorId, listId: list.id });

    expect(event.type).toBe("ListExported");
    expect(event.format).toBe("json-ld");
    expect(event.actorId).toBe(actorId);
  });

  it("export is always valid even on an empty list", () => {
    const { list } = List.create({ actorId });
    expect(() => list.exportListDocument({ actorId, listId: list.id })).not.toThrow();
  });
});

describe("List.getUncommittedEvents", () => {
  it("tracks all events since creation", () => {
    const { list } = List.create({ actorId });
    const content = createListElementContent("Item");
    const addEvent = list.addListElement({ actorId, listId: list.id, content });
    list.deleteListElement({ actorId, listId: list.id, listElementId: addEvent.listElementId });

    const events = list.getUncommittedEvents();
    expect(events).toHaveLength(3); // ListCreated + ListElementAdded + ListElementDeleted
    expect(events[0]?.type).toBe("ListCreated");
    expect(events[1]?.type).toBe("ListElementAdded");
    expect(events[2]?.type).toBe("ListElementDeleted");
  });

  it("clears after markEventsAsCommitted", () => {
    const { list } = List.create({ actorId });
    list.markEventsAsCommitted();
    expect(list.getUncommittedEvents()).toHaveLength(0);
  });
});

describe("List.rehydrate", () => {
  it("reconstructs state from event log", () => {
    const { list } = List.create({ actorId });
    const content1 = createListElementContent("First");
    const content2 = createListElementContent("Second");
    const addEvent1 = list.addListElement({ actorId, listId: list.id, content: content1 });
    list.addListElement({ actorId, listId: list.id, content: content2 });
    list.deleteListElement({ actorId, listId: list.id, listElementId: addEvent1.listElementId });

    const events = list.getUncommittedEvents();
    const rehydrated = List.rehydrate(list.id, [...events]);

    expect(rehydrated.elements).toHaveLength(1);
    expect(rehydrated.elements[0]?.content as string).toBe("Second");
  });

  it("rehydrated list has no uncommitted events", () => {
    const { list } = List.create({ actorId });
    const events = list.getUncommittedEvents();
    const rehydrated = List.rehydrate(list.id, [...events]);

    expect(rehydrated.getUncommittedEvents()).toHaveLength(0);
  });

  it("rehydrates title from ListCreated event", () => {
    const { list } = List.create({ actorId, title: "My List" });
    const events = list.getUncommittedEvents();
    const rehydrated = List.rehydrate(list.id, [...events]);

    expect(rehydrated.title).toBe("My List");
  });

  it("ListExported is an audit-only event — no state change on rehydrate", () => {
    const { list } = List.create({ actorId });
    list.exportListDocument({ actorId, listId: list.id });
    const events = list.getUncommittedEvents();
    const rehydrated = List.rehydrate(list.id, [...events]);

    expect(rehydrated.elements).toHaveLength(0);
  });
});

describe("Errors", () => {
  it("ListError is instanceof Error", () => {
    const err = new ListError("test");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ListError);
    expect(err.message).toBe("test");
  });

  it("ListElementNotFoundError is instanceof ListError", () => {
    const err = new ListElementNotFoundError("lse_abc");
    expect(err).toBeInstanceOf(ListError);
    expect(err).toBeInstanceOf(ListElementNotFoundError);
  });
});
