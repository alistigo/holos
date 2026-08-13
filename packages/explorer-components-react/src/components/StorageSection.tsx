import type { JSX } from "react";
import { useCallback, useRef, useState } from "react";
import type { FileEntry } from "./FileUploadForm.js";
import { FileUploadForm } from "./FileUploadForm.js";
import { FileViewer } from "./FileViewer.js";
import type { EntryStatus } from "./JsonDocumentViewer.js";
import { JsonDocumentViewer } from "./JsonDocumentViewer.js";
import { KeyList } from "./KeyList.js";

export interface UnifiedEntry {
  key: string;
  value: unknown;
  shared: boolean;
}

export interface StorageSectionProps {
  entries: UnifiedEntry[];
  isLoading: boolean;
  onDelete: (key: string, shared: boolean) => void;
  isDeletingEntry: { key: string; shared: boolean } | null;
  onCreate: (key: string, value: unknown, shared: boolean) => Promise<void>;
  onUpdate: (key: string, value: unknown, shared: boolean) => Promise<void>;
}

const DEBOUNCE_MS = 1000;

function eid(entry: { key: string; shared: boolean }): string {
  return `${entry.shared ? "s" : "p"}:${entry.key}`;
}

function parseId(id: string): { key: string; shared: boolean } {
  return { shared: id.startsWith("s:"), key: id.slice(2) };
}

function isFileEntry(value: unknown): value is FileEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "_type" in value &&
    (value as Record<string, unknown>)["_type"] === "file"
  );
}

function fileTypeBadge(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "IMG";
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("text/")) return "TXT";
  return "FILE";
}

// fallow-ignore-next-line complexity
export function StorageSection({
  entries,
  isLoading,
  onDelete,
  isDeletingEntry,
  onCreate,
  onUpdate,
}: StorageSectionProps): JSX.Element {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const [creationState, setCreationState] = useState<{
    key: string;
    shared: boolean;
    phase: "typing" | "saving";
  } | null>(null);

  const [entryStatuses, setEntryStatuses] = useState<Map<string, "draft" | "saving">>(new Map());
  const [editTexts, setEditTexts] = useState<Map<string, string>>(new Map());
  const [invalidIds, setInvalidIds] = useState<Set<string>>(new Set());
  const saveTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const keyListEntries = entries.map((e) => ({
    id: eid(e),
    label: e.key,
    isShared: e.shared,
    ...(isFileEntry(e.value) ? { fileTypeBadge: fileTypeBadge(e.value.mimeType) } : {}),
  }));

  const isDeletingId = isDeletingEntry !== null ? eid(isDeletingEntry) : null;

  const creationEid =
    creationState !== null ? eid({ key: creationState.key, shared: creationState.shared }) : null;
  const allKeyListEntries =
    creationState?.phase === "saving" &&
    creationEid !== null &&
    !keyListEntries.some((e) => e.id === creationEid)
      ? [
          ...keyListEntries,
          { id: creationEid, label: creationState.key, isShared: creationState.shared },
        ]
      : keyListEntries;

  const totalCount = allKeyListEntries.length;
  const keyLabel = `${totalCount} key${totalCount !== 1 ? "s" : ""}`;

  const handleSelectId = useCallback(
    (id: string) => {
      setShowUploadForm(false);
      setSelectedId(id);
      // fallow-ignore-next-line complexity
      setEditTexts((prev) => {
        if (prev.has(id)) return prev;
        const entry = entries.find((e) => eid(e) === id);
        const value = entry?.value ?? {};
        if (isFileEntry(value)) return prev;
        const next = new Map(prev);
        next.set(id, JSON.stringify(value, null, 2));
        return next;
      });
    },
    [entries],
  );

  const handleEditChange = useCallback(
    (id: string, rawText: string) => {
      setEditTexts((prev) => new Map(prev).set(id, rawText));

      let isValid = true;
      try {
        JSON.parse(rawText);
      } catch {
        isValid = false;
      }

      setInvalidIds((prev) => {
        const next = new Set(prev);
        if (isValid) next.delete(id);
        else next.add(id);
        return next;
      });

      setEntryStatuses((prev) => new Map(prev).set(id, "draft"));

      const existing = saveTimers.current.get(id);
      if (existing !== undefined) clearTimeout(existing);

      if (!isValid) return;

      const timer = setTimeout(() => {
        const parsed: unknown = JSON.parse(rawText);
        setEntryStatuses((prev) => new Map(prev).set(id, "saving"));
        const { key, shared } = parseId(id);
        void onUpdate(key, parsed, shared).then(() => {
          setEntryStatuses((prev) => {
            const next = new Map(prev);
            next.delete(id);
            return next;
          });
        });
        saveTimers.current.delete(id);
      }, DEBOUNCE_MS);
      saveTimers.current.set(id, timer);
    },
    [onUpdate],
  );

  const handleStartCreate = useCallback(() => {
    setShowUploadForm(false);
    setCreationState({ key: "", shared: false, phase: "typing" });
  }, []);

  const handleCancelCreate = useCallback(() => {
    setCreationState(null);
  }, []);

  const handleConfirmCreate = useCallback(async () => {
    if (creationState === null) return;
    const key = creationState.key.trim();
    const { shared } = creationState;
    if (key === "" || entries.some((e) => e.key === key && e.shared === shared)) return;

    setCreationState({ key, shared, phase: "saving" });
    const id = eid({ key, shared });
    setEntryStatuses((prev) => new Map(prev).set(id, "saving"));

    await onCreate(key, {}, shared);

    setCreationState(null);
    setEntryStatuses((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    setEditTexts((prev) => new Map(prev).set(id, JSON.stringify({}, null, 2)));
    setSelectedId(id);
  }, [creationState, entries, onCreate]);

  const handleDeleteId = useCallback(
    (id: string) => {
      if (selectedId === id) setSelectedId(null);
      const { key, shared } = parseId(id);
      onDelete(key, shared);
    },
    [selectedId, onDelete],
  );

  const handleUpload = useCallback(
    async (key: string, fileEntry: FileEntry, shared: boolean) => {
      await onCreate(key, fileEntry, shared);
      setShowUploadForm(false);
      const id = eid({ key, shared });
      setSelectedId(id);
    },
    [onCreate],
  );

  const selectedEntry =
    selectedId !== null ? entries.find((e) => eid(e) === selectedId) : undefined;
  const selectedValue = selectedEntry?.value;
  const isSelectedFile = isFileEntry(selectedValue);
  const currentEditText =
    !isSelectedFile && selectedId !== null ? editTexts.get(selectedId) : undefined;
  const currentSaveStatus: EntryStatus =
    selectedId !== null ? (entryStatuses.get(selectedId) ?? "saved") : "saved";
  const isCurrentEntryInvalid = selectedId !== null && invalidIds.has(selectedId);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="w-2/5 shrink-0 flex flex-col overflow-hidden">
          {creationState?.phase === "typing" && (
            <div className="px-2 py-1.5 border-b border-gray-100 bg-blue-50 shrink-0 flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <input
                  // biome-ignore lint/a11y/noAutofocus: intentional — user just clicked "+"
                  autoFocus
                  type="text"
                  value={creationState.key}
                  onChange={(e) =>
                    setCreationState({
                      key: e.target.value,
                      shared: creationState.shared,
                      phase: "typing",
                    })
                  }
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
                  disabled={
                    creationState.key.trim() === "" ||
                    entries.some(
                      (e) =>
                        e.key === creationState.key.trim() && e.shared === creationState.shared,
                    )
                  }
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
              <label className="flex items-center gap-1.5 text-xs text-gray-600 px-0.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={creationState.shared}
                  onChange={(e) =>
                    setCreationState({
                      key: creationState.key,
                      shared: e.target.checked,
                      phase: "typing",
                    })
                  }
                  className="accent-purple-500"
                />
                Shared
              </label>
            </div>
          )}
          <KeyList
            entries={allKeyListEntries}
            selectedId={selectedId}
            onSelectId={handleSelectId}
            isLoading={isLoading}
            label={keyLabel}
            emptyText="No keys found."
            entryStatuses={entryStatuses}
            onDeleteId={handleDeleteId}
            isDeletingId={isDeletingId}
            onUploadClick={() => {
              setCreationState(null);
              setShowUploadForm(true);
            }}
            {...(creationState === null ? { onCreateClick: handleStartCreate } : {})}
          />
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          {showUploadForm ? (
            <FileUploadForm onUpload={handleUpload} onCancel={() => setShowUploadForm(false)} />
          ) : isSelectedFile && selectedEntry !== undefined ? (
            <FileViewer entry={selectedEntry as UnifiedEntry & { value: FileEntry }} />
          ) : (
            <JsonDocumentViewer
              value={selectedValue}
              isLoading={isLoading}
              isInvalidJson={isCurrentEntryInvalid}
              saveStatus={currentSaveStatus}
              {...(currentEditText !== undefined && selectedId !== null
                ? {
                    editText: currentEditText,
                    onEditTextChange: (text: string) => handleEditChange(selectedId, text),
                  }
                : {})}
            />
          )}
        </div>
      </div>
    </div>
  );
}
