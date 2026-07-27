import type { ListElementContent } from "../value-objects/list-element-content.js";
import type { ListElementId } from "../value-objects/list-element-id.js";
import type { Timestamp } from "../value-objects/timestamp.js";

/**
 * ListElement entity — owned by List.
 * Accessed and mutated only through the List aggregate root.
 */
export interface ListElement {
  readonly id: ListElementId;
  readonly content: ListElementContent;
  readonly addedAt: Timestamp;
}
