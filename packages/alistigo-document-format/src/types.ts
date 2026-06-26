export type SemVer = `${number}.${number}.${number}`;
export type TypeIDString = string;

export const ALISTIGO_CONTEXT = {
  "@vocab": "https://schema.org/",
  alistigo: "https://alistigo.ai/vocab/",
} as const;

export type AlistigoContext = typeof ALISTIGO_CONTEXT;

export interface AlistigoDocument {
  "@context": AlistigoContext;
  "@type": "ItemList";
  "alistigo:listId": TypeIDString;
  "alistigo:schemaVersion": SemVer;
  name?: string;
  itemListElement: AlistigoListItem[];
  "alistigo:listEventLog": AlistigoEventRecord[];
}

export interface AlistigoListItem {
  "@type": "ListItem";
  "alistigo:listElementId": TypeIDString;
  position: number;
  name: string;
}

interface AlistigoEventRecordBase {
  "alistigo:listEventId": TypeIDString;
  "alistigo:eventType": string;
  "alistigo:listId": TypeIDString;
  "alistigo:actorId": TypeIDString;
  "alistigo:timestamp": string;
}

export interface AlistigoListCreatedRecord extends AlistigoEventRecordBase {
  "alistigo:eventType": "ListCreated";
  name?: string;
}

export interface AlistigoListElementAddedRecord extends AlistigoEventRecordBase {
  "alistigo:eventType": "ListElementAdded";
  "alistigo:listElementId": TypeIDString;
  name: string;
}

export interface AlistigoListElementDeletedRecord extends AlistigoEventRecordBase {
  "alistigo:eventType": "ListElementDeleted";
  "alistigo:listElementId": TypeIDString;
}

export interface AlistigoListExportedRecord extends AlistigoEventRecordBase {
  "alistigo:eventType": "ListExported";
}

export type AlistigoEventRecord =
  | AlistigoListCreatedRecord
  | AlistigoListElementAddedRecord
  | AlistigoListElementDeletedRecord
  | AlistigoListExportedRecord;
