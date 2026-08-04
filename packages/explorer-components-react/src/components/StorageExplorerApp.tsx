import type { JSX } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UnifiedEntry } from "./StorageSection.js";
import { StorageSection } from "./StorageSection.js";

import "@alistigo/claude-artifact-api";

export interface StorageExplorerAppProps {
  prefix?: string;
}

// fallow-ignore-next-line complexity
export function StorageExplorerApp({
  prefix: initialPrefix = "",
}: StorageExplorerAppProps): JSX.Element {
  const [prefix, setPrefix] = useState(initialPrefix);
  const [inputValue, setInputValue] = useState(initialPrefix);
  const [allEntries, setAllEntries] = useState<UnifiedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingEntry, setDeletingEntry] = useState<{ key: string; shared: boolean } | null>(null);
  const loadId = useRef(0);

  const reload = useCallback(async (currentPrefix: string) => {
    if (!window.storage) return;
    const id = ++loadId.current;
    setIsLoading(true);

    async function fetchSection(pfx: string, shared: boolean): Promise<UnifiedEntry[]> {
      const result = await window.storage?.list(pfx, shared);
      if (!result) return [];
      return await Promise.all(
        result.keys.map(async (key): Promise<UnifiedEntry> => {
          try {
            const item = await window.storage?.get(key, shared);
            let value: unknown;
            try {
              value = item !== undefined ? (JSON.parse(item.value) as unknown) : null;
            } catch {
              value = item?.value ?? null;
            }
            return { key, value, shared };
          } catch {
            return { key, value: null, shared };
          }
        }),
      );
    }

    const [priv, sharedEntries] = await Promise.all([
      fetchSection(currentPrefix, false),
      fetchSection(currentPrefix, true),
    ]);
    if (id !== loadId.current) return;
    setAllEntries([...priv, ...sharedEntries]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void reload(prefix);
  }, [prefix, reload]);

  function applyPrefix(): void {
    setPrefix(inputValue);
  }

  async function handleDelete(key: string, shared: boolean): Promise<void> {
    if (!window.storage) return;
    setDeletingEntry({ key, shared });
    try {
      await window.storage.delete(key, shared);
    } finally {
      setDeletingEntry(null);
      await reload(prefix);
    }
  }

  async function handleCreate(key: string, value: unknown, shared: boolean): Promise<void> {
    if (!window.storage) return;
    await window.storage.set(key, JSON.stringify(value), shared);
    await reload(prefix);
  }

  async function handleUpdate(key: string, value: unknown, shared: boolean): Promise<void> {
    if (!window.storage) return;
    await window.storage.set(key, JSON.stringify(value), shared);
    // Optimistic local update — avoids a full reload that would reset the editor state
    setAllEntries((prev) =>
      prev.map((e) => (e.key === key && e.shared === shared ? { ...e, value } : e)),
    );
  }

  const storageAvailable = typeof window !== "undefined" && window.storage !== undefined;

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 overflow-hidden">
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50">
        <span className="text-xs font-medium text-gray-500 shrink-0">Prefix</span>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyPrefix()}
          placeholder="Filter by prefix…"
          className="flex-1 text-xs font-mono border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
        />
        <button
          type="button"
          onClick={applyPrefix}
          className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shrink-0"
        >
          Load
        </button>
      </div>

      {!storageAvailable && (
        <div className="flex items-center justify-center flex-1 text-gray-400 text-sm p-8 text-center">
          <p>
            <span className="font-mono text-xs">window.storage</span> is not available.
            <br />
            This artifact must run inside a Claude conversation.
          </p>
        </div>
      )}

      {storageAvailable && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <StorageSection
            entries={allEntries}
            isLoading={isLoading}
            onDelete={(key, shared) => void handleDelete(key, shared)}
            isDeletingEntry={deletingEntry}
            onCreate={(key, value, shared) => handleCreate(key, value, shared)}
            onUpdate={(key, value, shared) => handleUpdate(key, value, shared)}
          />
        </div>
      )}
    </div>
  );
}
