import type { JSX } from "react";
import { useCallback, useRef, useState } from "react";
import type { EntryStatus } from "./JsonDocumentViewer.js";
import { JsonDocumentViewer } from "./JsonDocumentViewer.js";
import { KeyList } from "./KeyList.js";

export interface StorageSectionProps {
  label: string;
  entries: Record<string, unknown>;
  isLoading: boolean;
  onDelete: (key: string) => void;
  isDeletingKey: string | null;
  onCreate: (key: string, value: unknown) => Promise<void>;
  onUpdate: (key: string, value: unknown) => Promise<void>;
}

const DEBOUNCE_MS = 1000;

// fallow-ignore-next-line complexity
export function StorageSection({
  label,
  entries,
  isLoading,
  onDelete,
  isDeletingKey,
  onCreate,
  onUpdate,
}: StorageSectionProps): JSX.Element {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Creation flow state
  const [creationState, setCreationState] = useState<{
    key: string;
    phase: "typing" | "saving";
  } | null>(null);

  // Per-key status overlay (only draft/saving states; absent = saved)
  const [entryStatuses, setEntryStatuses] = useState<Map<string, "draft" | "saving">>(new Map());

  // Per-key raw JSON being edited
  const [editTexts, setEditTexts] = useState<Map<string, string>>(new Map());

  // Per-key invalid JSON tracking
  const [invalidKeys, setInvalidKeys] = useState<Set<string>>(new Set());

  // Debounce timers
  const saveTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // Keys shown in the list: real keys + any key being saved (optimistic)
  const realKeys = Object.keys(entries);
  const allKeys =
    creationState?.phase === "saving" && !realKeys.includes(creationState.key)
      ? [...realKeys, creationState.key]
      : realKeys;

  const totalKeyCount = allKeys.length;
  const keyLabel = `${totalKeyCount} key${totalKeyCount !== 1 ? "s" : ""}`;

  // When a key is selected, initialize its edit text from the stored value
  const handleSelectKey = useCallback(
    (key: string) => {
      setSelectedKey(key);
      setEditTexts((prev) => {
        if (prev.has(key)) return prev;
        const value = entries[key] ?? {};
        const next = new Map(prev);
        next.set(key, JSON.stringify(value, null, 2));
        return next;
      });
    },
    [entries],
  );

  const handleEditChange = useCallback(
    (key: string, rawText: string) => {
      setEditTexts((prev) => new Map(prev).set(key, rawText));

      let isValid = true;
      try {
        JSON.parse(rawText);
      } catch {
        isValid = false;
      }

      setInvalidKeys((prev) => {
        const next = new Set(prev);
        if (isValid) next.delete(key);
        else next.add(key);
        return next;
      });

      setEntryStatuses((prev) => new Map(prev).set(key, "draft"));

      // Clear any existing timer
      const existing = saveTimers.current.get(key);
      if (existing !== undefined) clearTimeout(existing);

      if (!isValid) return; // Don't schedule save for invalid JSON

      const timer = setTimeout(() => {
        // Re-read current text via closure-captured rawText (it's frozen at schedule time)
        // The actual save uses the value as-of when the timer was set
        const parsed: unknown = JSON.parse(rawText);
        setEntryStatuses((prev) => new Map(prev).set(key, "saving"));
        void onUpdate(key, parsed).then(() => {
          setEntryStatuses((prev) => {
            const next = new Map(prev);
            next.delete(key); // back to saved
            return next;
          });
        });
        saveTimers.current.delete(key);
      }, DEBOUNCE_MS);
      saveTimers.current.set(key, timer);
    },
    [onUpdate],
  );

  const handleStartCreate = useCallback(() => {
    setCreationState({ key: "", phase: "typing" });
  }, []);

  const handleCancelCreate = useCallback(() => {
    setCreationState(null);
  }, []);

  const handleConfirmCreate = useCallback(async () => {
    if (creationState === null) return;
    const key = creationState.key.trim();
    if (key === "" || key in entries) return;

    setCreationState({ key, phase: "saving" });
    setEntryStatuses((prev) => new Map(prev).set(key, "saving"));

    await onCreate(key, {});

    setCreationState(null);
    setEntryStatuses((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
    // Initialize edit text for the newly created key
    setEditTexts((prev) => new Map(prev).set(key, JSON.stringify({}, null, 2)));
    setSelectedKey(key);
  }, [creationState, entries, onCreate]);

  const selectedValue = selectedKey !== null ? entries[selectedKey] : undefined;
  const currentEditText = selectedKey !== null ? editTexts.get(selectedKey) : undefined;
  const currentSaveStatus: EntryStatus =
    selectedKey !== null ? (entryStatuses.get(selectedKey) ?? "saved") : "saved";
  const isCurrentKeyInvalid = selectedKey !== null && invalidKeys.has(selectedKey);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="px-3 py-1 bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wide shrink-0">
        {label}
      </div>
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="w-2/5 shrink-0 flex flex-col overflow-hidden">
          {/* Inline key name input for new entry creation */}
          {creationState?.phase === "typing" && (
            <div className="px-2 py-1.5 border-b border-gray-100 bg-blue-50 shrink-0 flex items-center gap-1">
              <input
                // biome-ignore lint/a11y/noAutofocus: intentional — user just clicked "+"
                autoFocus
                type="text"
                value={creationState.key}
                onChange={(e) => setCreationState({ key: e.target.value, phase: "typing" })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleConfirmCreate();
                  if (e.key === "Escape") handleCancelCreate();
                }}
                placeholder="Key name…"
                className="flex-1 min-w-0 text-xs font-mono border border-blue-300 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
              />
              <button
                type="button"
                onClick={() => void handleConfirmCreate()}
                disabled={creationState.key.trim() === "" || creationState.key.trim() in entries}
                className="text-xs px-1.5 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                title="Confirm"
              >
                ✓
              </button>
              <button
                type="button"
                onClick={handleCancelCreate}
                className="text-xs px-1.5 py-1 border border-gray-200 rounded hover:bg-gray-100 transition-colors shrink-0"
                title="Cancel"
              >
                ✕
              </button>
            </div>
          )}
          <KeyList
            keys={allKeys}
            selectedKey={selectedKey}
            onSelectKey={handleSelectKey}
            isLoading={isLoading}
            label={keyLabel}
            emptyText="No keys found."
            entryStatuses={entryStatuses}
            {...(creationState === null ? { onCreateClick: handleStartCreate } : {})}
          />
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          <JsonDocumentViewer
            value={selectedValue}
            isLoading={isLoading}
            isInvalidJson={isCurrentKeyInvalid}
            saveStatus={currentSaveStatus}
            {...(currentEditText !== undefined && selectedKey !== null
              ? {
                  editText: currentEditText,
                  onEditTextChange: (text: string) => handleEditChange(selectedKey, text),
                }
              : {})}
            {...(selectedKey !== null
              ? {
                  onDelete: () => onDelete(selectedKey),
                  isDeleting: isDeletingKey === selectedKey,
                }
              : {})}
          />
        </div>
      </div>
    </div>
  );
}
