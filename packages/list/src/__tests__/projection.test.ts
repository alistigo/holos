import { describe, expect, it } from "bun:test";
import { buildAttributionMap, buildProjection } from "../projection.js";
import { ALISTIGO_CONTEXT, type AlistigoDocument } from "../types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDoc(overrides: Partial<AlistigoDocument> = {}): AlistigoDocument {
  return {
    "@context": ALISTIGO_CONTEXT,
    "@type": "ItemList",
    identifier: "list_01abc",
    itemListElement: [],
    "alistigo:eventLog": [],
    ...overrides,
  };
}

const agent1 = {
  "@type": "Person" as const,
  identifier: "actor_01alice",
  "alistigo:userId": "user-alice",
  name: "Alice",
  image: "data:image/svg+xml;base64,ALICE",
};

const agent2 = {
  "@type": "Person" as const,
  identifier: "actor_02bob",
  "alistigo:userId": "user-bob",
  name: "Bob",
  image: "data:image/svg+xml;base64,BOB",
};

// ---------------------------------------------------------------------------
// buildAttributionMap
// ---------------------------------------------------------------------------

describe("buildAttributionMap", () => {
  it("returns an empty map when there are no agents", () => {
    const doc = makeDoc({
      "alistigo:eventLog": [
        {
          "alistigo:eventId": "evt_01",
          "alistigo:eventType": "ListElementAdded",
          "alistigo:listId": "list_01abc",
          "alistigo:agentId": "actor_01alice",
          "alistigo:timestamp": "2026-01-01T00:00:00.000Z",
          "alistigo:listElementId": "elem_01",
          name: "Buy bread",
        },
      ],
    });

    const map = buildAttributionMap(doc);
    expect(map.size).toBe(0);
  });

  // fallow-ignore-next-line complexity
  it("maps element IDs to agent info for matching ListElementAdded events", () => {
    const doc = makeDoc({
      "alistigo:agents": [agent1, agent2],
      "alistigo:eventLog": [
        {
          "alistigo:eventId": "evt_01",
          "alistigo:eventType": "ListElementAdded",
          "alistigo:listId": "list_01abc",
          "alistigo:agentId": "actor_01alice",
          "alistigo:timestamp": "2026-01-01T10:00:00.000Z",
          "alistigo:listElementId": "elem_01",
          name: "Buy bread",
        },
        {
          "alistigo:eventId": "evt_02",
          "alistigo:eventType": "ListElementAdded",
          "alistigo:listId": "list_01abc",
          "alistigo:agentId": "actor_02bob",
          "alistigo:timestamp": "2026-01-01T11:00:00.000Z",
          "alistigo:listElementId": "elem_02",
          name: "Call mom",
        },
      ],
    });

    const map = buildAttributionMap(doc);

    expect(map.size).toBe(2);

    const attr1 = map.get("elem_01");
    expect(attr1?.actorId).toBe("actor_01alice");
    expect(attr1?.pseudo).toBe("Alice");
    expect(attr1?.avatar).toBe("data:image/svg+xml;base64,ALICE");
    expect(attr1?.addedAt).toBe("2026-01-01T10:00:00.000Z");

    const attr2 = map.get("elem_02");
    expect(attr2?.actorId).toBe("actor_02bob");
    expect(attr2?.pseudo).toBe("Bob");
  });

  it("uses first-write-wins when multiple ListElementAdded events exist for the same element", () => {
    const doc = makeDoc({
      "alistigo:agents": [agent1, agent2],
      "alistigo:eventLog": [
        {
          "alistigo:eventId": "evt_01",
          "alistigo:eventType": "ListElementAdded",
          "alistigo:listId": "list_01abc",
          "alistigo:agentId": "actor_01alice",
          "alistigo:timestamp": "2026-01-01T10:00:00.000Z",
          "alistigo:listElementId": "elem_01",
          name: "Buy bread",
        },
        {
          // duplicate for the same element — should be ignored
          "alistigo:eventId": "evt_03",
          "alistigo:eventType": "ListElementAdded",
          "alistigo:listId": "list_01abc",
          "alistigo:agentId": "actor_02bob",
          "alistigo:timestamp": "2026-01-01T12:00:00.000Z",
          "alistigo:listElementId": "elem_01",
          name: "Buy bread",
        },
      ],
    });

    const map = buildAttributionMap(doc);
    const attr = map.get("elem_01");
    expect(attr?.actorId).toBe("actor_01alice");
  });

  it("skips ListElementAdded events whose agentId is not in the agents section", () => {
    const doc = makeDoc({
      "alistigo:agents": [agent1],
      "alistigo:eventLog": [
        {
          "alistigo:eventId": "evt_01",
          "alistigo:eventType": "ListElementAdded",
          "alistigo:listId": "list_01abc",
          "alistigo:agentId": "actor_unknown",
          "alistigo:timestamp": "2026-01-01T10:00:00.000Z",
          "alistigo:listElementId": "elem_01",
          name: "Buy bread",
        },
      ],
    });

    const map = buildAttributionMap(doc);
    expect(map.has("elem_01")).toBe(false);
  });

  it("ignores non-ListElementAdded events", () => {
    const doc = makeDoc({
      "alistigo:agents": [agent1, agent2],
      "alistigo:eventLog": [
        {
          "alistigo:eventId": "evt_01",
          "alistigo:eventType": "ListCreated",
          "alistigo:listId": "list_01abc",
          "alistigo:agentId": "actor_01alice",
          "alistigo:timestamp": "2026-01-01T09:00:00.000Z",
        },
        {
          "alistigo:eventId": "evt_02",
          "alistigo:eventType": "ListElementChecked",
          "alistigo:listId": "list_01abc",
          "alistigo:agentId": "actor_01alice",
          "alistigo:timestamp": "2026-01-01T10:00:00.000Z",
          "alistigo:listElementId": "elem_01",
          checked: true,
        },
      ],
    });

    const map = buildAttributionMap(doc);
    expect(map.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// buildProjection
// ---------------------------------------------------------------------------

describe("buildProjection", () => {
  it("returns a projection with no attribution when agents section is empty", () => {
    const doc = makeDoc({
      itemListElement: [
        {
          "@type": "ListItem",
          "alistigo:listElementId": "elem_01",
          position: 1,
          name: "Buy bread",
        },
      ],
      "alistigo:eventLog": [
        {
          "alistigo:eventId": "evt_01",
          "alistigo:eventType": "ListElementAdded",
          "alistigo:listId": "list_01abc",
          "alistigo:agentId": "actor_01alice",
          "alistigo:timestamp": "2026-01-01T10:00:00.000Z",
          "alistigo:listElementId": "elem_01",
          name: "Buy bread",
        },
      ],
    });

    const projection = buildProjection(doc);
    expect(projection.itemListElement[0]?.["alistigo:attribution"]).toBeUndefined();
  });

  it("returns a projection with no attribution when only 1 agent is present", () => {
    const doc = makeDoc({
      "alistigo:agents": [agent1],
      itemListElement: [
        {
          "@type": "ListItem",
          "alistigo:listElementId": "elem_01",
          position: 1,
          name: "Buy bread",
        },
      ],
      "alistigo:eventLog": [
        {
          "alistigo:eventId": "evt_01",
          "alistigo:eventType": "ListElementAdded",
          "alistigo:listId": "list_01abc",
          "alistigo:agentId": "actor_01alice",
          "alistigo:timestamp": "2026-01-01T10:00:00.000Z",
          "alistigo:listElementId": "elem_01",
          name: "Buy bread",
        },
      ],
    });

    const projection = buildProjection(doc);
    expect(projection.itemListElement[0]?.["alistigo:attribution"]).toBeUndefined();
  });

  // fallow-ignore-next-line complexity
  it("populates attribution when 2+ agents are present and events match", () => {
    const doc = makeDoc({
      "alistigo:agents": [agent1, agent2],
      itemListElement: [
        {
          "@type": "ListItem",
          "alistigo:listElementId": "elem_01",
          position: 1,
          name: "Buy bread",
        },
        {
          "@type": "ListItem",
          "alistigo:listElementId": "elem_02",
          position: 2,
          name: "Call mom",
        },
      ],
      "alistigo:eventLog": [
        {
          "alistigo:eventId": "evt_01",
          "alistigo:eventType": "ListElementAdded",
          "alistigo:listId": "list_01abc",
          "alistigo:agentId": "actor_01alice",
          "alistigo:timestamp": "2026-01-01T10:00:00.000Z",
          "alistigo:listElementId": "elem_01",
          name: "Buy bread",
        },
        {
          "alistigo:eventId": "evt_02",
          "alistigo:eventType": "ListElementAdded",
          "alistigo:listId": "list_01abc",
          "alistigo:agentId": "actor_02bob",
          "alistigo:timestamp": "2026-01-01T11:00:00.000Z",
          "alistigo:listElementId": "elem_02",
          name: "Call mom",
        },
      ],
    });

    const projection = buildProjection(doc);

    const item1 = projection.itemListElement[0];
    expect(item1?.["alistigo:attribution"]).toBeDefined();
    expect(item1?.["alistigo:attribution"]?.actorId).toBe("actor_01alice");
    expect(item1?.["alistigo:attribution"]?.pseudo).toBe("Alice");
    expect(item1?.["alistigo:attribution"]?.avatar).toBe("data:image/svg+xml;base64,ALICE");
    expect(item1?.["alistigo:attribution"]?.addedAt).toBe("2026-01-01T10:00:00.000Z");

    const item2 = projection.itemListElement[1];
    expect(item2?.["alistigo:attribution"]?.actorId).toBe("actor_02bob");
  });

  it("leaves attribution undefined when element agent is not in the agents section", () => {
    const doc = makeDoc({
      "alistigo:agents": [agent1, agent2],
      itemListElement: [
        {
          "@type": "ListItem",
          "alistigo:listElementId": "elem_unknown",
          position: 1,
          name: "Mystery item",
        },
      ],
      "alistigo:eventLog": [
        {
          "alistigo:eventId": "evt_01",
          "alistigo:eventType": "ListElementAdded",
          "alistigo:listId": "list_01abc",
          "alistigo:agentId": "actor_ghost",
          "alistigo:timestamp": "2026-01-01T10:00:00.000Z",
          "alistigo:listElementId": "elem_unknown",
          name: "Mystery item",
        },
      ],
    });

    const projection = buildProjection(doc);
    expect(projection.itemListElement[0]?.["alistigo:attribution"]).toBeUndefined();
  });

  it("produces correct numberOfItems and positions", () => {
    const doc = makeDoc({
      "alistigo:agents": [agent1, agent2],
      itemListElement: [
        {
          "@type": "ListItem",
          "alistigo:listElementId": "elem_01",
          position: 1,
          name: "First",
        },
        {
          "@type": "ListItem",
          "alistigo:listElementId": "elem_02",
          position: 2,
          name: "Second",
        },
      ],
      "alistigo:eventLog": [],
    });

    const projection = buildProjection(doc);
    expect(projection["@type"]).toBe("ItemList");
    expect(projection.numberOfItems).toBe(2);
    expect(projection.itemListElement[0]?.position).toBe(1);
    expect(projection.itemListElement[1]?.position).toBe(2);
    expect(projection.itemListElement[0]?.item["@type"]).toBe("Thing");
    expect(projection.itemListElement[0]?.item.name).toBe("First");
    expect(projection.itemListElement[0]?.item["@id"]).toBe("elem_01");
  });
});
