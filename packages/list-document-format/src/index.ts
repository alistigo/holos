export {
  buildListDocumentFromMarkdown,
  isValidListMarkdown,
  type MarkdownParseResult,
  parseListMarkdown,
} from "./markdown/list-markdown.js";
export {
  buildAttributionMap,
  buildProjection,
  type AlistigoItemAttribution,
  type AlistigoProjection,
  type AlistigoProjectionItem,
} from "./projection.js";
export { ListDocumentSerializer, SCHEMA_VERSION } from "./serializer/list-document-serializer.js";
export * from "./types.js";
export { validateDocument } from "./validate.js";

import documentSchemaJson from "./schemas/document.json" with { type: "json" };
export const documentSchema = documentSchemaJson;
