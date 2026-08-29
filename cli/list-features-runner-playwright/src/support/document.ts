import type { AlistigoDocument, AlistigoEventRecord } from "@alistigo/list-document";
import { ALISTIGO_CONTEXT } from "@alistigo/list-document";

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
    identifier: fixtureEventId(1),
    "alistigo:eventType": "ListCreated",
    list: { "@id": FIXTURE_LIST_ID },
    agent: FIXTURE_ACTOR_ID,
    startTime: FIXTURE_TIMESTAMP,
  };

  return {
    "@context": ALISTIGO_CONTEXT,
    "@type": "ItemList",
    identifier: FIXTURE_LIST_ID,
    itemListElement: [],
    "alistigo:eventLog": [listCreated],
  };
}

export function buildPopulatedDocument(elementTexts: readonly string[]): AlistigoDocument {
  const events: AlistigoEventRecord[] = [
    {
      identifier: fixtureEventId(1),
      "alistigo:eventType": "ListCreated",
      list: { "@id": FIXTURE_LIST_ID },
      agent: FIXTURE_ACTOR_ID,
      startTime: FIXTURE_TIMESTAMP,
    },
    ...elementTexts.map((text, index) => ({
      identifier: fixtureEventId(index + 2),
      "alistigo:eventType": "ListElementAdded" as const,
      list: { "@id": FIXTURE_LIST_ID },
      listItem: { "@id": fixtureElementId(index) },
      agent: FIXTURE_ACTOR_ID,
      startTime: FIXTURE_TIMESTAMP,
      name: text,
    })),
  ];

  return {
    "@context": ALISTIGO_CONTEXT,
    "@type": "ItemList",
    identifier: FIXTURE_LIST_ID,
    itemListElement: elementTexts.map((text, index) => ({
      "@type": "ListItem" as const,
      "alistigo:listElementId": fixtureElementId(index),
      position: index + 1,
      name: text,
    })),
    "alistigo:eventLog": events,
  };
}
