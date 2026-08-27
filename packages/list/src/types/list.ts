import type {
  AlistigoAgentRecord,
  AlistigoContext,
  AlistigoPluginRecord,
  TypeIDString,
} from "@alistigo/document";
import type { ItemListLeaf, ListItemLeaf } from "schema-dts";

export interface AlistigoDocument extends ItemListLeaf {
  "@context": AlistigoContext;
  identifier: TypeIDString;
  name?: string;
  itemListElement: AlistigoListItem[];
  "alistigo:eventLog": AlistigoEventRecord[];
  "alistigo:agents"?: AlistigoAgentRecord[];
  "alistigo:plugins"?: AlistigoPluginRecord[];
}

export interface AlistigoListItem extends ListItemLeaf {
  "alistigo:listElementId": TypeIDString;
  position: number;
  name: string;
  "alistigo:metadatas"?: Record<string, Record<string, unknown>>;
}

interface AlistigoEventRecordBase {
  "alistigo:eventId": TypeIDString;
  "alistigo:eventType": string;
  "alistigo:listId": TypeIDString;
  "alistigo:agentId": TypeIDString;
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
