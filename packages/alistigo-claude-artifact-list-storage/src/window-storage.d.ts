interface ClaudeStorageResult {
  key: string;
  value: string;
  shared: boolean;
}

interface ClaudeStorageListResult {
  keys: string[];
  prefix?: string;
  shared: boolean;
}

interface ClaudeStorage {
  get(key: string, shared?: boolean): Promise<ClaudeStorageResult>;
  set(key: string, value: string, shared?: boolean): Promise<ClaudeStorageResult | null>;
  delete(
    key: string,
    shared?: boolean,
  ): Promise<{ key: string; deleted: boolean; shared: boolean } | null>;
  list(prefix?: string, shared?: boolean): Promise<ClaudeStorageListResult | null>;
}

interface Window {
  storage?: ClaudeStorage;
}
