import type { ListElementId } from "../value-objects/list-element-id.js";
import type { ActorListCommand } from "./actor-list-command.js";

/** Command to remove a ListElement from a List by its stable identity. */
export interface DeleteListElement extends ActorListCommand {
  readonly listElementId: ListElementId;
}
