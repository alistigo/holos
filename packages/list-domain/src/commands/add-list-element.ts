import type { ListElementContent } from "../value-objects/list-element-content.js";
import type { ActorListCommand } from "./actor-list-command.js";

/** Command to append a new ListElement to a List. */
export interface AddListElement extends ActorListCommand {
  readonly content: ListElementContent;
}
