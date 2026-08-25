import type { AlistigoDocument } from "./types.js";

// ---------------------------------------------------------------------------
// Projection types
// ---------------------------------------------------------------------------

export interface AlistigoItemAttribution {
  actorId: string;
  pseudo: string;
  avatar: string; // base64 data URL
  addedAt: string; // ISO 8601 timestamp from the ListElementAdded event
}

export interface AlistigoProjectionItem {
  "@type": "ListItem";
  position: number;
  item: {
    "@type": "Thing";
    "@id": string;
    name: string;
  };
  "alistigo:attribution"?: AlistigoItemAttribution;
}

export interface AlistigoProjection {
  "@type": "ItemList";
  numberOfItems: number;
  itemListElement: AlistigoProjectionItem[];
}

// ---------------------------------------------------------------------------
// Projection builder
// ---------------------------------------------------------------------------

/**
 * Builds a per-element attribution map from the actor records and event log
 * in the document. Only the first `ListElementAdded` event for each element
 * is used (first-write-wins). Returns an empty map when actors are absent.
 */
export function buildAttributionMap(doc: AlistigoDocument): Map<string, AlistigoItemAttribution> {
  const actorsById = new Map((doc["alistigo:actors"] ?? []).map((a) => [a["alistigo:actorId"], a]));
  const result = new Map<string, AlistigoItemAttribution>();

  for (const event of doc["alistigo:listEventLog"]) {
    if (event["alistigo:eventType"] === "ListElementAdded") {
      const elementId = event["alistigo:listElementId"];
      if (!result.has(elementId)) {
        const actor = actorsById.get(event["alistigo:actorId"]);
        if (actor) {
          result.set(elementId, {
            actorId: actor["alistigo:actorId"],
            pseudo: actor["alistigo:pseudo"],
            avatar: actor["alistigo:avatar"],
            addedAt: event["alistigo:timestamp"],
          });
        }
      }
    }
  }

  return result;
}

/**
 * Derives a view-model projection from an `AlistigoDocument`.
 *
 * Attribution (`"alistigo:attribution"`) is populated on each item only when
 * the document contains **2 or more** actor records — a list with a single
 * actor has no meaningful attribution context to display.
 */
export function buildProjection(doc: AlistigoDocument): AlistigoProjection {
  const actors = doc["alistigo:actors"] ?? [];
  const attributionMap =
    actors.length >= 2 ? buildAttributionMap(doc) : new Map<string, AlistigoItemAttribution>();

  const itemListElement: AlistigoProjectionItem[] = doc.itemListElement.map((item, index) => {
    const elementId = item["alistigo:listElementId"];
    const attribution = attributionMap.get(elementId);

    const projectionItem: AlistigoProjectionItem = {
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Thing",
        "@id": elementId,
        name: item.name,
      },
    };

    if (attribution !== undefined) {
      projectionItem["alistigo:attribution"] = attribution;
    }

    return projectionItem;
  });

  return {
    "@type": "ItemList",
    numberOfItems: itemListElement.length,
    itemListElement,
  };
}
