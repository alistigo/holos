import type { ListElementContent, ListElementId, ListEvent, ListId } from "@alistigo/domain";

/**
 * Projection of a List's current visible state, derived from its event log.
 * Contains only elements that are currently present (deletes are applied).
 */
export interface ListProjection {
  listId: ListId;
  elements: ReadonlyArray<{ id: ListElementId; content: ListElementContent }>;
}

/**
 * Replays a list of events to produce the current visible projection.
 * Deterministic: same events → same projection.
 *
 * - ListCreated     → no element change
 * - ListElementAdded   → append element
 * - ListElementDeleted → remove element by id
 * - ListExported    → ignored (audit-only)
 */
// fallow-ignore-next-line complexity
export function projectList(listId: ListId, events: readonly ListEvent[]): ListProjection {
  const elements: Array<{ id: ListElementId; content: ListElementContent }> = [];

  for (const event of events) {
    switch (event.type) {
      case "ListCreated":
        break;

      case "ListElementAdded":
        elements.push({ id: event.listElementId, content: event.content });
        break;

      case "ListElementDeleted": {
        const idStr = event.listElementId.toString();
        const idx = elements.findIndex((el) => el.id.toString() === idStr);
        if (idx !== -1) {
          elements.splice(idx, 1);
        }
        break;
      }

      case "ListExported":
        break;
    }
  }

  return { listId, elements };
}

/** Namespace object kept for callers that use `ListProjector.project(...)`. */
export const ListProjector = { project: projectList };
