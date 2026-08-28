import type { Agent, AlistigoContext, Plugin } from "@alistigo/document";
import type { ItemListLeaf, ListItemLeaf } from "schema-dts";

export type AlistigoAgentRecord = Agent;
export type AlistigoPluginRecord = Plugin;

export interface AlistigoDocument extends ItemListLeaf {
  "@context": AlistigoContext;
  identifier: string;
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
  identifier: string;
  "alistigo:eventType": string;
  "alistigo:listId": string;
  agent: string;
  startTime: string;
}

export interface AlistigoListCreatedRecord extends AlistigoEventRecordBase {
  "alistigo:eventType": "ListCreated";
  name?: string;
}

export interface AlistigoListElementAddedRecord extends AlistigoEventRecordBase {
  "alistigo:eventType": "ListElementAdded";
  "alistigo:listElementId": string;
  name: string;
}

export interface AlistigoListElementDeletedRecord extends AlistigoEventRecordBase {
  "alistigo:eventType": "ListElementDeleted";
  "alistigo:listElementId": string;
}

export interface AlistigoListExportedRecord extends AlistigoEventRecordBase {
  "alistigo:eventType": "ListExported";
}

export interface AlistigoListElementCheckedRecord extends AlistigoEventRecordBase {
  "alistigo:eventType": "ListElementChecked";
  "alistigo:listElementId": string;
  checked: boolean;
}

export type AlistigoEventRecord =
  | AlistigoListCreatedRecord
  | AlistigoListElementAddedRecord
  | AlistigoListElementDeletedRecord
  | AlistigoListExportedRecord
  | AlistigoListElementCheckedRecord;
