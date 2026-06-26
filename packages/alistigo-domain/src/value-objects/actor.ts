/**
 * Actor describes the role of the party involved in a ListEvent.
 * - user: A human interacting with the ListWidget
 * - llm: An AI system (e.g. Claude) issuing a command
 * - host: The embedding platform or application
 * - system: Automated/internal process
 */
export type Actor = "user" | "llm" | "host" | "system";
