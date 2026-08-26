import {
  createListElementContent,
  createTimestamp,
  List,
  type ListEvent,
  parseActorId,
  parseListElementId,
  parseListEventId,
  parseListId,
} from "@alistigo/list-domain";
import {
  ALISTIGO_CONTEXT,
  type AlistigoActorRecord,
  type AlistigoDocument,
  type AlistigoEventRecord,
  type AlistigoListCreatedRecord,
  type AlistigoListElementAddedRecord,
  type AlistigoListElementCheckedRecord,
  type AlistigoListElementDeletedRecord,
  type AlistigoListExportedRecord,
  type AlistigoListItem,
} from "../types.js";

export const SCHEMA_VERSION = "1.1.0" as const;

interface SerializeOptions {
  actorsById?: Map<string, AlistigoActorRecord>;
}

function eventToRecord(event: ListEvent): AlistigoEventRecord {
  const base = {
    "alistigo:eventId": event.listEventId.toString(),
    "alistigo:listId": event.listId.toString(),
    "alistigo:actorId": event.actorId.toString(),
    "alistigo:timestamp": event.timestamp,
  };

  switch (event.type) {
    case "ListCreated": {
      const record: AlistigoListCreatedRecord = {
        ...base,
        "alistigo:eventType": "ListCreated",
        ...(event.title !== undefined ? { name: event.title } : {}),
      };
      return record;
    }
    case "ListElementAdded": {
      const record: AlistigoListElementAddedRecord = {
        ...base,
        "alistigo:eventType": "ListElementAdded",
        "alistigo:listElementId": event.listElementId.toString(),
        name: event.content,
      };
      return record;
    }
    case "ListElementDeleted": {
      const record: AlistigoListElementDeletedRecord = {
        ...base,
        "alistigo:eventType": "ListElementDeleted",
        "alistigo:listElementId": event.listElementId.toString(),
      };
      return record;
    }
    case "ListExported": {
      const record: AlistigoListExportedRecord = {
        ...base,
        "alistigo:eventType": "ListExported",
      };
      return record;
    }
  }
}

function recordToEvent(record: AlistigoEventRecord): ListEvent | null {
  // Plugin-owned events have no domain representation — skip before parsing TypeIDs.
  if (record["alistigo:eventType"] === "ListElementChecked") {
    return null;
  }

  const base = {
    listEventId: parseListEventId(record["alistigo:eventId"]),
    listId: parseListId(record["alistigo:listId"]),
    actorId: parseActorId(record["alistigo:actorId"]),
    timestamp: createTimestamp(record["alistigo:timestamp"]),
  };

  switch (record["alistigo:eventType"]) {
    case "ListCreated": {
      const created = record as AlistigoListCreatedRecord;
      return {
        ...base,
        type: "ListCreated",
        ...(created.name !== undefined ? { title: created.name } : {}),
      };
    }
    case "ListElementAdded": {
      const added = record as AlistigoListElementAddedRecord;
      return {
        ...base,
        type: "ListElementAdded",
        listElementId: parseListElementId(added["alistigo:listElementId"]),
        content: createListElementContent(added.name),
      };
    }
    case "ListElementDeleted": {
      const deleted = record as AlistigoListElementDeletedRecord;
      return {
        ...base,
        type: "ListElementDeleted",
        listElementId: parseListElementId(deleted["alistigo:listElementId"]),
      };
    }
    case "ListExported": {
      return {
        ...base,
        type: "ListExported",
        format: "json-ld",
      };
    }
  }
}

export const ListDocumentSerializer = {
  // fallow-ignore-next-line complexity
  serialize(
    list: List,
    previousDocument?: AlistigoDocument,
    options?: SerializeOptions,
  ): AlistigoDocument {
    const existingLog = previousDocument?.["alistigo:eventLog"] ?? [];
    const newRecords = list.getUncommittedEvents().map(eventToRecord);

    // Build a map of previous metadatas keyed by listElementId for preservation
    const prevMetadatasById = new Map<string, Record<string, Record<string, unknown>>>();
    for (const item of previousDocument?.itemListElement ?? []) {
      if (item["alistigo:metadatas"] !== undefined) {
        prevMetadatasById.set(item["alistigo:listElementId"], item["alistigo:metadatas"]);
      }
    }

    const itemListElement: AlistigoListItem[] = list.elements.map((element, index) => {
      const elementId = element.id.toString();
      const item: AlistigoListItem = {
        "@type": "ListItem" as const,
        "alistigo:listElementId": elementId,
        position: index + 1,
        name: element.content,
      };
      const prevMetadatas = prevMetadatasById.get(elementId);
      if (prevMetadatas !== undefined) {
        item["alistigo:metadatas"] = prevMetadatas;
      }
      return item;
    });

    const doc: AlistigoDocument = {
      "@context": ALISTIGO_CONTEXT,
      "@type": "ItemList",
      "alistigo:listId": list.id.toString(),
      "alistigo:schemaVersion": SCHEMA_VERSION,
      itemListElement: itemListElement,
      "alistigo:eventLog": [...existingLog, ...newRecords],
    };

    if (list.title !== undefined) {
      doc.name = list.title;
    }

    // Merge actors if actorsById option is provided
    if (options?.actorsById !== undefined) {
      const existingActors: AlistigoActorRecord[] = previousDocument?.["alistigo:actors"] ?? [];
      const mergedActors = [...existingActors];

      for (const [, actor] of options.actorsById) {
        const existingIndex = mergedActors.findIndex(
          (a) => a["alistigo:actorId"] === actor["alistigo:actorId"],
        );
        if (existingIndex >= 0) {
          mergedActors[existingIndex] = actor;
        } else {
          mergedActors.push(actor);
        }
      }

      doc["alistigo:actors"] = mergedActors;
    } else if (previousDocument?.["alistigo:actors"] !== undefined) {
      // Preserve existing actors even when no update is provided
      doc["alistigo:actors"] = previousDocument["alistigo:actors"];
    }

    // Preserve plugins from the previous document
    if (previousDocument?.["alistigo:plugins"] !== undefined) {
      doc["alistigo:plugins"] = previousDocument["alistigo:plugins"];
    }

    return doc;
  },

  deserialize(doc: AlistigoDocument): List {
    const listId = parseListId(doc["alistigo:listId"]);
    const events = doc["alistigo:eventLog"]
      .map(recordToEvent)
      .filter((e): e is ListEvent => e !== null);
    return List.rehydrate(listId, events);
  },
};
