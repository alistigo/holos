export interface ArtifactConfig {
  app: string;
  lang?: string;
  /** Keyed by plugin npm package name; each plugin defines its own config shape. */
  plugins?: Record<string, Record<string, unknown>>;
  [key: string]: unknown; // allow artifact-specific fields
}
