export type TypeIDString = string;

export const ALISTIGO_CONTEXT = {
  "@vocab": "https://schema.org/",
  alistigo: "https://alistigo.ai/vocab/",
} as const;

export type AlistigoContext = typeof ALISTIGO_CONTEXT;

export interface AlistigoDocument {
  "@context": AlistigoContext;
  "@type": "ItemList";
  identifier: TypeIDString;
  name?: string;
  itemListElement: AlistigoListItem[];
  "alistigo:eventLog": AlistigoEventRecord[];
  "alistigo:actors"?: AlistigoActorRecord[];
  "alistigo:plugins"?: AlistigoPluginRecord[];
}

export interface AlistigoListItem {
  "@type": "ListItem";
  "alistigo:listElementId": TypeIDString;
  position: number;
  name: string;
  "alistigo:metadatas"?: Record<string, Record<string, unknown>>;
}

interface AlistigoEventRecordBase {
  "alistigo:eventId": TypeIDString;
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

export interface AlistigoActorRecord {
  "alistigo:actorId": TypeIDString;
  "alistigo:userId": string;
  "alistigo:pseudo": string;
  "alistigo:avatar": string; // base64 SVG data URL
}

export interface AlistigoPluginRecord {
  name: string;
  version?: string;
  config?: Record<string, unknown>;
}

export interface AlistigoListElementCheckedRecord extends AlistigoEventRecordBase {
  "alistigo:eventType": "ListElementChecked";
  "alistigo:listElementId": TypeIDString;
  checked: boolean;
}

export type AlistigoEventRecord =
  | AlistigoListCreatedRecord
  | AlistigoListElementAddedRecord
  | AlistigoListElementDeletedRecord
  | AlistigoListExportedRecord
  | AlistigoListElementCheckedRecord;
