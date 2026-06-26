import type { ListId } from "../value-objects/list-id.js";
import type { ActorCommand } from "./actor-command.js";

/**
 * Command to create a new List.
 * Extends ActorCommand directly (no listId required — it is the creation command).
 * listId is optional; if omitted, the handler generates one.
 */
export interface CreateList extends ActorCommand {
  readonly title?: string;
  readonly listId?: ListId;
}
