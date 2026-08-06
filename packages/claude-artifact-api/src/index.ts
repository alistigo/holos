export interface ClaudeStorageGetResult {
  key: string;
  value: string;
  shared: boolean;
  "@type": string;
}

export interface ClaudeStorageSetResult {
  key: string;
  value: string;
  shared: boolean;
  "@type": string;
}

export interface ClaudeStorageDeleteResult {
  key: string;
  deleted: boolean;
  shared: boolean;
  "@type": string;
}

export interface ClaudeStorageListResult {
  keys: string[];
  prefix: string;
  shared: boolean;
  "@type": string;
}

export interface ClaudeStorage {
  /** Rejects (never resolves) when the key does not exist. */
  get(key: string, shared?: boolean): Promise<ClaudeStorageGetResult>;
  set(key: string, value: string, shared?: boolean): Promise<ClaudeStorageSetResult>;
  /** Rejects (never resolves) when the key does not exist. */
  delete(key: string, shared?: boolean): Promise<ClaudeStorageDeleteResult>;
  list(prefix?: string, shared?: boolean): Promise<ClaudeStorageListResult>;
}

export interface ClaudeApi {
  complete(prompt: string): Promise<string>;
}

declare global {
  interface Window {
    storage?: ClaudeStorage;
    claude?: ClaudeApi;
  }
}

export interface ArtifactContext {
  /** True only when the artifact is accessed via its published public URL. */
  published: boolean;
  /** The artifact UUID extracted from the public URL, or null in draft mode. */
  artifactId: string | null;
}

/**
 * Detects whether the artifact is running in draft (AI preview panel) or
 * published (public URL) mode by inspecting document.baseURI.
 *
 * Draft:     https://www.claudeusercontent.com/?domain=…        → published: false
 * Published: https://www.claudeusercontent.com/artifact/<uuid>  → published: true
 */
export function artifactContext(): ArtifactContext {
  let path = "";
  try {
    path = new URL(document.baseURI).pathname;
  } catch {}
  const m = path.match(/^\/artifact\/([0-9a-f-]{36})/i);
  return { published: Boolean(m), artifactId: m?.[1] ?? null };
}
