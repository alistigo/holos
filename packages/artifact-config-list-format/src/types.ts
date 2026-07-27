/**
 * Configuration document for the Alistigo list artifact.
 * Stored as the artifact's config document alongside the list document.
 */
export interface ListArtifactConfig {
  /** When true, the list cannot be modified by users. Defaults to false. */
  readonly?: boolean;
}
