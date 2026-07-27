import type { AlistigoDocument } from "@alistigo/list-document-format";

export interface MountOptions {
  /** Pre-populated document to seed the list. Defaults to an empty list. */
  document?: AlistigoDocument;
  /**
   * BCP-47 locale code. No effect at runtime — locale is fixed at build
   * time via the LOCALE env var. Provided for documentation only.
   */
  locale?: string;
  /** Plugins to load, keyed by npm package name, each with its own config object. */
  plugins?: Record<string, Record<string, unknown>>;
}
