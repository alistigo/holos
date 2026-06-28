/**
 * @alistigo/document-editor
 *
 * The Application layer of the Alistigo system.
 *
 * Public API:
 *   - ListApplicationService — orchestrates commands through the List domain
 *     aggregate, persists via AlistigoListStore, returns AlistigoDocument.
 *   - AlistigoListStore — the extended repository interface (ListRepository +
 *     loadDocument) that infrastructure adapters must implement.
 *   - ListProjector — stateless domain service: events → ListProjection.
 *   - Result<T, E> / ok / err — lightweight result type for service methods.
 *
 * What this package does NOT own:
 *   - UI / React (lives in @alistigo/list-components-react).
 *   - Persistence implementation (LocalStorageListRepository, etc.).
 *   - Schema validation (lives in @alistigo/document-format).
 */

// Application service
export {
  type AlistigoListStore,
  ListApplicationService,
} from "./application/list-application-service.js";

// Projector
export {
  type ListProjection,
  ListProjector,
  projectList,
} from "./projector/list-projector.js";

// Result type
export { err, ok, type Result } from "./result.js";

// @public
