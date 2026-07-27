import type { List } from "../aggregates/list.js";
import type { ListId } from "../value-objects/list-id.js";

/**
 * ListRepository interface — the domain port for List persistence.
 * Infrastructure provides the implementation (e.g. LocalStorageListRepository in M1).
 */
export interface ListRepository {
  load(id: ListId): Promise<List | undefined>;
  save(list: List): Promise<void>;
}
