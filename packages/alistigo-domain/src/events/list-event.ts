import type { ActorId } from "../value-objects/actor-id.js";
import type { ListElementContent } from "../value-objects/list-element-content.js";
import type { ListElementId } from "../value-objects/list-element-id.js";
import type { ListEventId } from "../value-objects/list-event-id.js";
import type { ListId } from "../value-objects/list-id.js";
import type { Timestamp } from "../value-objects/timestamp.js";

/** Base shape shared by all ListEvents. */
export interface ListEventBase {
  readonly listEventId: ListEventId;
  readonly listId: ListId;
  readonly actorId: ActorId;
  readonly timestamp: Timestamp;
}

export interface ListCreated extends ListEventBase {
  readonly type: "ListCreated";
  readonly title?: string;
}

export interface ListElementAdded extends ListEventBase {
  readonly type: "ListElementAdded";
  readonly listElementId: ListElementId;
  readonly content: ListElementContent;
}

export interface ListElementDeleted extends ListEventBase {
  readonly type: "ListElementDeleted";
  readonly listElementId: ListElementId;
}

export interface ListExported extends ListEventBase {
  readonly type: "ListExported";
  readonly format: "json-ld";
}

export type ListEvent = ListCreated | ListElementAdded | ListElementDeleted | ListExported;
