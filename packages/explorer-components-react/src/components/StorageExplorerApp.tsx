import type { JSX } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UnifiedEntry } from "./StorageSection.js";
import { StorageSection } from "./StorageSection.js";

import "@alistigo/claude-artifact-api";

// fallow-ignore-next-line complexity
export function StorageExplorerApp(): JSX.Element {
  const [allEntries, setAllEntries] = useState<UnifiedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingEntry, setDeletingEntry] = useState<{ key: string; shared: boolean } | null>(null);
  const loadId = useRef(0);

  const reload = useCallback(async () => {
    if (!window.storage) return;
    const id = ++loadId.current;
    setIsLoading(true);

    async function fetchSection(shared: boolean): Promise<UnifiedEntry[]> {
      const result = await window.storage?.list("", shared);
      if (!result) return [];
      // fallow-ignore-next-line complexity
      async function fetchEntry(key: string): Promise<UnifiedEntry> {
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
      }
      return await Promise.all(result.keys.map(fetchEntry));
    }

    const [priv, sharedEntries] = await Promise.all([fetchSection(false), fetchSection(true)]);
    if (id !== loadId.current) return;
    setAllEntries([...priv, ...sharedEntries]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleDelete(key: string, shared: boolean): Promise<void> {
    if (!window.storage) return;
    setDeletingEntry({ key, shared });
    try {
      await window.storage.delete(key, shared);
    } finally {
      setDeletingEntry(null);
      await reload();
    }
  }

  async function handleCreate(key: string, value: unknown, shared: boolean): Promise<void> {
    if (!window.storage) return;
    await window.storage.set(key, JSON.stringify(value), shared);
    await reload();
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
            onReload={() => void reload()}
          />
        </div>
      )}
    </div>
  );
}
