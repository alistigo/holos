import type { Agent, AlistigoContext, Plugin } from "@alistigo/core-document";
import type { ItemListLeaf, ListItemLeaf } from "schema-dts";

export interface Reference {
  "@id": string;
}

export type AlistigoAgentRecord = Agent;
export type AlistigoPluginRecord = Plugin;

export interface AlistigoDocument extends ItemListLeaf {
  "@context": AlistigoContext;
  "@id": string;
  name?: string;
  itemListElement: AlistigoListItem[];
  "alistigo:eventLog": AlistigoEventRecord[];
  "alistigo:agents"?: AlistigoAgentRecord[];
  "alistigo:plugins"?: AlistigoPluginRecord[];
}

export interface AlistigoListItem extends ListItemLeaf {
  "alistigo:listElementId": string;
  position: number;
  name: string;
  "alistigo:metadatas"?: Record<string, Record<string, unknown>>;
}

interface AlistigoEventRecordBase {
  "@id": string;
  "alistigo:eventType": string;
  list: Reference;
  agent: Reference;
  startTime: string;
}

export interface AlistigoListCreatedRecord extends AlistigoEventRecordBase {
  "alistigo:eventType": "ListCreated";
  name?: string;
}

export interface AlistigoListElementAddedRecord extends AlistigoEventRecordBase {
  "alistigo:eventType": "ListElementAdded";
  listItem: Reference;
  name: string;
}

export interface AlistigoListElementDeletedRecord extends AlistigoEventRecordBase {
  "alistigo:eventType": "ListElementDeleted";
  listItem: Reference;
}

export interface AlistigoListExportedRecord extends AlistigoEventRecordBase {
  "alistigo:eventType": "ListExported";
}

export interface AlistigoListElementCheckedRecord extends AlistigoEventRecordBase {
  "alistigo:eventType": "ListElementChecked";
  listItem: Reference;
  checked: boolean;
}

export type AlistigoEventRecord =
  | AlistigoListCreatedRecord
  | AlistigoListElementAddedRecord
  | AlistigoListElementDeletedRecord
  | AlistigoListExportedRecord
  | AlistigoListElementCheckedRecord;
