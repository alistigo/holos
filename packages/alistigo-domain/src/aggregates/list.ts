import type { AddListElement } from "../commands/add-list-element.js";
import type { CreateList } from "../commands/create-list.js";
import type { DeleteListElement } from "../commands/delete-list-element.js";
import type { ExportListDocument } from "../commands/export-list-document.js";
import type { ListElement } from "../entities/list-element.js";
import { ListElementNotFoundError } from "../errors/list-error.js";
import type { ListCreated } from "../events/list-created.js";
import type { ListElementAdded } from "../events/list-element-added.js";
import type { ListElementDeleted } from "../events/list-element-deleted.js";
import type { ListEvent } from "../events/list-event.js";
import type { ListExported } from "../events/list-exported.js";
import { generateListElementId } from "../value-objects/list-element-id.js";
import { generateListEventId } from "../value-objects/list-event-id.js";
import type { ListId } from "../value-objects/list-id.js";
import { generateListId } from "../value-objects/list-id.js";
import { nowTimestamp } from "../value-objects/timestamp.js";

/**
 * List aggregate root.
 *
 * - Private constructor: use List.create() or List.rehydrate().
 * - All state changes flow through command handlers which emit events.
 * - applyEvent() is the only method that mutates internal state.
 */
export class List {
  readonly #id: ListId;
  #title: string | undefined;
  readonly #elements: Map<string, ListElement>;
  readonly #uncommittedEvents: ListEvent[];

  private constructor(id: ListId) {
    this.#id = id;
    this.#title = undefined;
    this.#elements = new Map();
    this.#uncommittedEvents = [];
  }

  get id(): ListId {
    return this.#id;
  }

  get title(): string | undefined {
    return this.#title;
  }

  get elements(): ReadonlyArray<ListElement> {
    return [...this.#elements.values()];
  }

  // ─────────────────────────────────────────────── Factory

  /**
   * Creates a new List aggregate and emits ListCreated.
   * Generates a ListId if not provided in the command.
   */
  static create(cmd: CreateList): { list: List; event: ListCreated } {
    const listId = cmd.listId ?? generateListId();
    const list = new List(listId);

    const event: ListCreated = {
      type: "ListCreated",
      listEventId: generateListEventId(),
      listId,
      actorId: cmd.actorId,
      timestamp: nowTimestamp(),
      ...(cmd.title !== undefined ? { title: cmd.title } : {}),
    };

    list.#applyEvent(event);
    list.#uncommittedEvents.push(event);
    return { list, event };
  }

  // ─────────────────────────────────────────────── Rehydration

  /**
   * Reconstructs a List from its full event log.
   * The resulting List has no uncommitted events.
   */
  static rehydrate(id: ListId, events: ListEvent[]): List {
    const list = new List(id);
    for (const event of events) {
      list.#applyEvent(event);
    }
    return list;
  }

  // ─────────────────────────────────────────────── Command Handlers

  /**
   * Appends a new ListElement to the List.
   * Invariant: content must be non-empty after trimming (enforced at ListElementContent creation).
   */
  addListElement(cmd: AddListElement): ListElementAdded {
    const listElementId = generateListElementId();

    const event: ListElementAdded = {
      type: "ListElementAdded",
      listEventId: generateListEventId(),
      listId: this.#id,
      actorId: cmd.actorId,
      timestamp: nowTimestamp(),
      listElementId,
      content: cmd.content,
    };

    this.#applyEvent(event);
    this.#uncommittedEvents.push(event);
    return event;
  }

  /**
   * Removes a ListElement from the List by its stable identity.
   * Invariant: the ListElementId must exist in the current elements.
   * Throws ListElementNotFoundError if not found.
   */
  deleteListElement(cmd: DeleteListElement): ListElementDeleted {
    const idStr = cmd.listElementId.toString();
    if (!this.#elements.has(idStr)) {
      throw new ListElementNotFoundError(idStr);
    }

    const event: ListElementDeleted = {
      type: "ListElementDeleted",
      listEventId: generateListEventId(),
      listId: this.#id,
      actorId: cmd.actorId,
      timestamp: nowTimestamp(),
      listElementId: cmd.listElementId,
    };

    this.#applyEvent(event);
    this.#uncommittedEvents.push(event);
    return event;
  }

  /**
   * Emits a ListExported audit event.
   * Export is always valid — no invariants to check.
   */
  exportListDocument(cmd: ExportListDocument): ListExported {
    const event: ListExported = {
      type: "ListExported",
      listEventId: generateListEventId(),
      listId: this.#id,
      actorId: cmd.actorId,
      timestamp: nowTimestamp(),
      format: "json-ld",
    };

    this.#applyEvent(event);
    this.#uncommittedEvents.push(event);
    return event;
  }

  // ─────────────────────────────────────────────── Uncommitted Events

  /** Returns all events emitted since the last load/save. */
  getUncommittedEvents(): ReadonlyArray<ListEvent> {
    return [...this.#uncommittedEvents];
  }

  /** Clears uncommitted events after they have been persisted. */
  markEventsAsCommitted(): void {
    this.#uncommittedEvents.length = 0;
  }

  // ─────────────────────────────────────────────── Private State Mutation

  /** Mutates state from a single event. Used by both command handlers and rehydration. */
  #applyEvent(event: ListEvent): void {
    const handlers: { [K in ListEvent["type"]]: (e: Extract<ListEvent, { type: K }>) => void } = {
      ListCreated: (e) => {
        this.#title = e.title;
      },
      ListElementAdded: (e) => {
        this.#elements.set(e.listElementId.toString(), {
          id: e.listElementId,
          content: e.content,
          addedAt: e.timestamp,
        });
      },
      ListElementDeleted: (e) => {
        this.#elements.delete(e.listElementId.toString());
      },
      // Audit-only event — no state change
      ListExported: (_e) => {},
    };
    // biome-ignore lint/suspicious/noExplicitAny: safe — handler key is narrowed by event.type
    (handlers[event.type] as (e: any) => void)(event);
  }
}
