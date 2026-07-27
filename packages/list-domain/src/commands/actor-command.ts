import type { ActorId } from "../value-objects/actor-id.js";

/** Abstract base for all commands. Carries actorId — who is issuing the command. */
export interface ActorCommand {
  readonly actorId: ActorId;
}
