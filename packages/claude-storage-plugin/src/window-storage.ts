// Side-effect import triggers the declare global { interface Window { storage?, claude? } } augmentation.
import "@alistigo/claude-artifact-api";

export type {
  ClaudeApi,
  ClaudeStorage,
  ClaudeStorageDeleteResult,
  ClaudeStorageGetResult,
  ClaudeStorageListResult,
  ClaudeStorageSetResult,
} from "@alistigo/claude-artifact-api";
