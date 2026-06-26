export interface ArtifactConfig {
  app: string;
  lang?: string;
  [key: string]: unknown; // allow artifact-specific fields
}
