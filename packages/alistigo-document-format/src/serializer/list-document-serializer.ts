import {
  createListElementContent,
  createTimestamp,
  List,
  type ListEvent,
  parseActorId,
  parseListElementId,
  parseListEventId,
  parseListId,
} from "@alistigo/domain";
import {
  ALISTIGO_CONTEXT,
  type AlistigoDocument,
  type AlistigoEventRecord,
  type AlistigoListCreatedRecord,
  type AlistigoListElementAddedRecord,
  type AlistigoListElementDeletedRecord,
  type AlistigoListExportedRecord,
} from "../types.js";

export const SCHEMA_VERSION = "1.0.0" as const;

function eventToRecord(event: ListEvent): AlistigoEventRecord {
  const base = {
    "alistigo:listEventId": event.listEventId.toString(),
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

function recordToEvent(record: AlistigoEventRecord): ListEvent {
  const base = {
    listEventId: parseListEventId(record["alistigo:listEventId"]),
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
  serialize(list: List, previousDocument?: AlistigoDocument): AlistigoDocument {
    const existingLog = previousDocument?.["alistigo:listEventLog"] ?? [];
    const newRecords = list.getUncommittedEvents().map(eventToRecord);

    const itemListElement = list.elements.map((element, index) => ({
      "@type": "ListItem" as const,
      "alistigo:listElementId": element.id.toString(),
      position: index + 1,
      name: element.content,
    }));

    const doc: AlistigoDocument = {
      "@context": ALISTIGO_CONTEXT,
      "@type": "ItemList",
      "alistigo:listId": list.id.toString(),
      "alistigo:schemaVersion": SCHEMA_VERSION,
      itemListElement: itemListElement,
      "alistigo:listEventLog": [...existingLog, ...newRecords],
    };

    if (list.title !== undefined) {
      doc.name = list.title;
    }

    return doc;
  },

  deserialize(doc: AlistigoDocument): List {
    const listId = parseListId(doc["alistigo:listId"]);
    const events = doc["alistigo:listEventLog"].map(recordToEvent);
    return List.rehydrate(listId, events);
  },
};
