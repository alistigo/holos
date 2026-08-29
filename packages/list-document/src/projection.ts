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

// fallow-ignore-next-line complexity
export function buildAttributionMap(doc: AlistigoDocument): Map<string, AlistigoItemAttribution> {
  const agentsById = new Map((doc["alistigo:agents"] ?? []).map((a) => [a["@id"], a]));
  const result = new Map<string, AlistigoItemAttribution>();

  for (const event of doc["alistigo:eventLog"]) {
    if (event["alistigo:eventType"] === "ListElementAdded") {
      const elementId = event["listItem"]["@id"];
      if (!result.has(elementId)) {
        const agent = agentsById.get(event.agent["@id"]);
        if (agent) {
          result.set(elementId, {
            actorId: agent["@id"],
            pseudo: agent.name,
            avatar: typeof agent.image === "string" ? agent.image : "",
            addedAt: event.startTime,
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
 * the document contains **2 or more** agent records — a list with a single
 * agent has no meaningful attribution context to display.
 */
export function buildProjection(doc: AlistigoDocument): AlistigoProjection {
  const agents = doc["alistigo:agents"] ?? [];
  const attributionMap =
    agents.length >= 2 ? buildAttributionMap(doc) : new Map<string, AlistigoItemAttribution>();

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
