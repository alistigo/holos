import type { JSX } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { StorageSection } from "./StorageSection.js";

import "@alistigo/claude-artifact-api";

export interface StorageExplorerAppProps {
  prefix?: string;
}

interface LoadState {
  private: boolean;
  shared: boolean;
}

// fallow-ignore-next-line complexity
export function StorageExplorerApp({
  prefix: initialPrefix = "",
}: StorageExplorerAppProps): JSX.Element {
  const [prefix, setPrefix] = useState(initialPrefix);
  const [inputValue, setInputValue] = useState(initialPrefix);
  const [privateEntries, setPrivateEntries] = useState<Record<string, unknown>>({});
  const [sharedEntries, setSharedEntries] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState<LoadState>({ private: true, shared: true });
  const [deletingKey, setDeletingKey] = useState<{ key: string; shared: boolean } | null>(null);
  const loadId = useRef(0);

  const reload = useCallback(async (currentPrefix: string) => {
    if (!window.storage) return;
    const id = ++loadId.current;
    setLoading({ private: true, shared: true });

    async function fetchAll(pfx: string, isShared: boolean): Promise<Record<string, unknown>> {
      const result = await window.storage!.list(pfx, isShared);
      if (!result) return {};
      const pairs = await Promise.all(
        result.keys.map(async (key): Promise<[string, unknown]> => {
          try {
            const item = await window.storage!.get(key, isShared);
            let parsed: unknown;
            try {
              parsed = JSON.parse(item.value) as unknown;
            } catch {
              parsed = item.value;
            }
            return [key, parsed];
          } catch {
            return [key, null];
          }
        }),
      );
      return Object.fromEntries(pairs);
    }

    const [priv, sharedResult] = await Promise.all([
      fetchAll(currentPrefix, false),
      fetchAll(currentPrefix, true),
    ]);
    if (id !== loadId.current) return;
    setPrivateEntries(priv);
    setSharedEntries(sharedResult);
    setLoading({ private: false, shared: false });
  }, []);

  useEffect(() => {
    void reload(prefix);
  }, [prefix, reload]);

  function applyPrefix(): void {
    setPrefix(inputValue);
  }

  async function handleDelete(key: string, isShared: boolean): Promise<void> {
    if (!window.storage) return;
    setDeletingKey({ key, shared: isShared });
    try {
      await window.storage.delete(key, isShared);
    } finally {
      setDeletingKey(null);
      await reload(prefix);
    }
  }

  async function handleCreate(key: string, value: unknown, isShared: boolean): Promise<void> {
    if (!window.storage) return;
    await window.storage.set(key, JSON.stringify(value), isShared);
    await reload(prefix);
  }

  async function handleUpdate(key: string, value: unknown, isShared: boolean): Promise<void> {
    if (!window.storage) return;
    await window.storage.set(key, JSON.stringify(value), isShared);
    // Optimistic local update — avoids a full reload that would reset the editor state
    if (isShared) {
      setSharedEntries((prev) => ({ ...prev, [key]: value }));
    } else {
      setPrivateEntries((prev) => ({ ...prev, [key]: value }));
    }
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
          Filter
        </button>
        <button
          type="button"
          onClick={() => void reload(prefix)}
          className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-100 transition-colors shrink-0"
          title="Reload"
        >
          ↺
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
        <div className="flex flex-col flex-1 overflow-hidden divide-y divide-gray-100">
          <div className="flex-1 min-h-0 overflow-hidden">
            <StorageSection
              label="Private"
              entries={privateEntries}
              isLoading={loading.private}
              onDelete={(key) => void handleDelete(key, false)}
              isDeletingKey={deletingKey?.shared === false ? deletingKey.key : null}
              onCreate={(key, value) => handleCreate(key, value, false)}
              onUpdate={(key, value) => handleUpdate(key, value, false)}
            />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <StorageSection
              label="Shared"
              entries={sharedEntries}
              isLoading={loading.shared}
              onDelete={(key) => void handleDelete(key, true)}
              isDeletingKey={deletingKey?.shared === true ? deletingKey.key : null}
              onCreate={(key, value) => handleCreate(key, value, true)}
              onUpdate={(key, value) => handleUpdate(key, value, true)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
