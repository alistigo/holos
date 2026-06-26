import type { AlistigoDocument, AlistigoEventRecord } from "@alistigo/document-format";
import { ALISTIGO_CONTEXT, SCHEMA_VERSION } from "@alistigo/document-format";

// Fixed TypeID-style strings for deterministic test fixtures.
// TypeID format: <prefix>_<26-char Crockford base32>
// All-zeros ULID is valid; incrementing the last digit keeps IDs unique.
const FIXTURE_LIST_ID = "lst_00000000000000000000000001";
const FIXTURE_ACTOR_ID = "act_00000000000000000000000001";
const FIXTURE_TIMESTAMP = "2026-01-01T00:00:00.000Z";

function fixtureEventId(index: number): string {
  const suffix = String(index).padStart(26, "0");
  return `lev_${suffix}`;
}

function fixtureElementId(index: number): string {
  const suffix = String(index + 1).padStart(26, "0");
  return `lse_${suffix}`;
}

export function buildEmptyDocument(): AlistigoDocument {
  const listCreated: AlistigoEventRecord = {
    "alistigo:listEventId": fixtureEventId(1),
    "alistigo:eventType": "ListCreated",
    "alistigo:listId": FIXTURE_LIST_ID,
    "alistigo:actorId": FIXTURE_ACTOR_ID,
    "alistigo:timestamp": FIXTURE_TIMESTAMP,
  };

  return {
    "@context": ALISTIGO_CONTEXT,
    "@type": "ItemList",
    "alistigo:listId": FIXTURE_LIST_ID,
    "alistigo:schemaVersion": SCHEMA_VERSION,
    itemListElement: [],
    "alistigo:listEventLog": [listCreated],
  };
}

export function buildPopulatedDocument(elementTexts: readonly string[]): AlistigoDocument {
  const events: AlistigoEventRecord[] = [
    {
      "alistigo:listEventId": fixtureEventId(1),
      "alistigo:eventType": "ListCreated",
      "alistigo:listId": FIXTURE_LIST_ID,
      "alistigo:actorId": FIXTURE_ACTOR_ID,
      "alistigo:timestamp": FIXTURE_TIMESTAMP,
    },
    ...elementTexts.map((text, index) => ({
      "alistigo:listEventId": fixtureEventId(index + 2),
      "alistigo:eventType": "ListElementAdded" as const,
      "alistigo:listId": FIXTURE_LIST_ID,
      "alistigo:listElementId": fixtureElementId(index),
      "alistigo:actorId": FIXTURE_ACTOR_ID,
      "alistigo:timestamp": FIXTURE_TIMESTAMP,
      name: text,
    })),
  ];

  return {
    "@context": ALISTIGO_CONTEXT,
    "@type": "ItemList",
    "alistigo:listId": FIXTURE_LIST_ID,
    "alistigo:schemaVersion": SCHEMA_VERSION,
    itemListElement: elementTexts.map((text, index) => ({
      "@type": "ListItem" as const,
      "alistigo:listElementId": fixtureElementId(index),
      position: index + 1,
      name: text,
    })),
    "alistigo:listEventLog": events,
  };
}
