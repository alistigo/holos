import type { ListId } from "../value-objects/list-id.js";
import type { ActorCommand } from "./actor-command.js";

/** Abstract base for all commands that operate on an existing List. */
export interface ActorListCommand extends ActorCommand {
  readonly listId: ListId;
}
