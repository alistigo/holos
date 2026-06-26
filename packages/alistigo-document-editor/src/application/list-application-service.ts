import type { AlistigoDocument } from "@alistigo/document-format";
import type { ActorId, ListElementId, ListId, ListRepository } from "@alistigo/domain";
import {
  createListElementContent,
  generateListId,
  List,
  ListElementNotFoundError,
  ListError,
} from "@alistigo/domain";
import { createLogger } from "@alistigo/logger";
import { err, ok, type Result } from "../result.js";

const log = createLogger("alistigo:service");

/**
 * Extended repository interface that adds raw-document access on top of the
 * standard ListRepository port. Infrastructure implementations (e.g.
 * LocalStorageListRepository) must implement all three methods.
 */
export interface AlistigoListStore extends ListRepository {
  loadDocument(id: ListId): Promise<AlistigoDocument | undefined>;
}

/**
 * Application service for the Core List context.
 *
 * Orchestrates commands through the List aggregate, persists via
 * AlistigoListStore, and returns AlistigoDocument on success or a typed
 * ListError on failure.
 */
export class ListApplicationService {
  constructor(private readonly store: AlistigoListStore) {}

  /**
   * Creates a new list and persists it.
   * Returns the initial AlistigoDocument on success.
   */
  // fallow-ignore-next-line complexity
  async createList(
    actorId: ActorId,
    title?: string,
    listId?: ListId,
  ): Promise<Result<AlistigoDocument, ListError>> {
    try {
      const resolvedListId = listId ?? generateListId();
      log.debug({ listId: resolvedListId.toString(), title }, "createList");
      const { list } = List.create({
        actorId,
        listId: resolvedListId,
        ...(title !== undefined ? { title } : {}),
      });
      return await this.#saveAndReturn(list, resolvedListId);
    } catch (e) {
      if (e instanceof ListError) return err(e);
      throw e;
    }
  }

  /**
   * Appends a new element to the list identified by listId.
   * Returns the updated AlistigoDocument on success.
   */
  async addListElement(
    listId: ListId,
    content: string,
    actorId: ActorId,
  ): Promise<Result<AlistigoDocument, ListError>> {
    try {
      log.debug({ listId: listId.toString(), content }, "addListElement");
      const list = await this.store.load(listId);
      if (!list) return err(new ListElementNotFoundError(listId.toString()));
      const listContent = createListElementContent(content);
      list.addListElement({ actorId, listId, content: listContent });
      return await this.#saveAndReturn(list, listId);
    } catch (e) {
      if (e instanceof ListError) return err(e);
      throw e;
    }
  }

  /**
   * Removes a list element by its stable ListElementId.
   * Returns the updated AlistigoDocument on success.
   */
  async deleteListElement(
    listId: ListId,
    listElementId: ListElementId,
    actorId: ActorId,
  ): Promise<Result<AlistigoDocument, ListError>> {
    try {
      log.debug(
        { listId: listId.toString(), elementId: listElementId.toString() },
        "deleteListElement",
      );
      const list = await this.store.load(listId);
      if (!list) return err(new ListElementNotFoundError(listId.toString()));
      list.deleteListElement({ actorId, listId, listElementId });
      return await this.#saveAndReturn(list, listId);
    } catch (e) {
      if (e instanceof ListError) return err(e);
      throw e;
    }
  }

  /**
   * Read-only: returns the persisted AlistigoDocument for display or export.
   */
  async loadDocument(listId: ListId): Promise<AlistigoDocument | undefined> {
    return this.store.loadDocument(listId);
  }

  /**
   * Emits a ListExported audit event and returns the document.
   */
  async exportListDocument(
    listId: ListId,
    actorId: ActorId,
  ): Promise<Result<AlistigoDocument, ListError>> {
    try {
      const list = await this.store.load(listId);
      if (!list) return err(new ListElementNotFoundError(listId.toString()));
      list.exportListDocument({ actorId, listId });
      return await this.#saveAndReturn(list, listId);
    } catch (e) {
      if (e instanceof ListError) return err(e);
      throw e;
    }
  }

  async #saveAndReturn(list: List, listId: ListId): Promise<Result<AlistigoDocument, ListError>> {
    await this.store.save(list);
    list.markEventsAsCommitted();
    const doc = await this.store.loadDocument(listId);
    log.debug(
      { listId: listId.toString(), elementCount: doc?.itemListElement.length },
      "document saved",
    );
    // biome-ignore lint/style/noNonNullAssertion: just saved, must exist
    return ok(doc!);
  }
}
