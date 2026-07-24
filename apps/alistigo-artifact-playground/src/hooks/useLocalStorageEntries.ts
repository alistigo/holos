import localStoragePlugin from "@alistigo/local-storage-plugin";
import { useCallback, useEffect, useState } from "react";

// localStoragePlugin always provides storage — derive type from the plugin to avoid
// importing @alistigo/artifact-plugin-api directly into the playground.
type LocalStorage = NonNullable<typeof localStoragePlugin.storage>;
const storage = localStoragePlugin.storage as LocalStorage;

/**
 * Returns all localStorage entries whose keys start with `prefix`, refreshed
 * whenever a `storage` event fires (same-origin cross-frame writes) or the
 * caller invokes the returned `refresh()` function.
 */
export function useLocalStorageEntries(prefix = "alistigo"): {
  entries: [string, string][];
  refresh: () => void;
} {
  const [entries, setEntries] = useState<[string, string][]>([]);

  const refresh = useCallback(() => {
    void storage.listKeys(prefix).then((raw) => {
      setEntries(raw.map(({ key, value }) => [key, value] as [string, string]));
    });
  }, [prefix]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === null || event.key.startsWith(prefix)) {
        refresh();
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [prefix, refresh]);

  return { entries, refresh };
}
