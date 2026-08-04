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
