import type { JSX } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UnifiedEntry } from "./StorageSection.js";
import { StorageSection } from "./StorageSection.js";
import type { TextDocumentFormat } from "./TextDocumentEditor.js";

import "@alistigo/claude-artifact-api";

const FILE_META_SUFFIX = ".__file-meta";

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

      // Companion metadata keys are internal — hide from the entry list
      const userKeys = result.keys.filter((k) => !k.endsWith(FILE_META_SUFFIX));

      // fallow-ignore-next-line complexity
      async function fetchEntry(key: string): Promise<UnifiedEntry> {
        try {
          const item = await window.storage?.get(key, shared);
          const rawValue = item?.value;
          let value: unknown;

          if (typeof rawValue === "string") {
            try {
              value = JSON.parse(rawValue) as unknown;
            } catch {
              value = rawValue;
            }
          } else {
            value = rawValue ?? null;
          }

          return { key, value, shared };
        } catch {
          return { key, value: null, shared };
        }
      }

      return await Promise.all(userKeys.map(fetchEntry));
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
      // Delete companion metadata key if it exists (binary file entries only)
      try {
        await window.storage.delete(`${key}${FILE_META_SUFFIX}`, shared);
      } catch {
        // No companion key — expected for non-binary entries
      }
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

  async function handleCreateText(
    key: string,
    text: string,
    shared: boolean,
    format: TextDocumentFormat,
  ): Promise<void> {
    if (!window.storage) return;
    let storedValue: string;
    if (format === "plain") {
      storedValue = text;
    } else {
      storedValue = JSON.stringify({
        _type: "document",
        format,
        content: text,
        createdAt: new Date().toISOString(),
      });
    }
    await window.storage.set(key, storedValue, shared);
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
            onCreateText={(key, text, shared, format) =>
              handleCreateText(key, text, shared, format)
            }
            onReload={() => void reload()}
          />
        </div>
      )}
    </div>
  );
}
