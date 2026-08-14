import type { JSX } from "react";
import { useCallback, useRef, useState } from "react";
import type { EntryStatus } from "./DocumentViewer.js";
import type { FileEntry } from "./FileUploadForm.js";
import { KeyContentViewer } from "./KeyContentViewer.js";
import { KeyList } from "./KeyList.js";
import type { TextDocumentEntry } from "./NewEntryPanel.js";
import { NewEntryPanel } from "./NewEntryPanel.js";
import { StorageUsageBar } from "./StorageUsageBar.js";
import type { TextDocumentFormat } from "./TextDocumentEditor.js";

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
  onCreateText?: (
    key: string,
    text: string,
    shared: boolean,
    format: TextDocumentFormat,
  ) => Promise<void>;
  onReload?: () => void;
}

const DEBOUNCE_MS = 1000;
const MAX_TOTAL_MIB = 17;
const MAX_TOTAL_BYTES = MAX_TOTAL_MIB * 1024 * 1024;

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
    (value as Record<string, unknown>)._type === "file"
  );
}

function isTextDocumentEntry(value: unknown): value is TextDocumentEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "_type" in value &&
    (value as Record<string, unknown>)._type === "document"
  );
}

// fallow-ignore-next-line complexity
function fileTypeBadge(mimeType: string): string {
  if (mimeType === "image/jpeg") return "JPG";
  if (mimeType === "image/png") return "PNG";
  if (mimeType === "image/gif") return "GIF";
  if (mimeType === "image/webp") return "WEBP";
  if (mimeType === "image/svg+xml") return "SVG";
  if (mimeType === "image/avif") return "AVIF";
  if (mimeType.startsWith("image/")) return "IMG";
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType === "video/mp4") return "MP4";
  if (mimeType === "video/webm") return "WEBM";
  if (mimeType.startsWith("video/")) return "VID";
  if (mimeType === "audio/mpeg") return "MP3";
  if (mimeType === "audio/ogg") return "OGG";
  if (mimeType.startsWith("audio/")) return "AUD";
  if (mimeType.startsWith("text/")) return "TXT";
  return "FILE";
}

function documentTypeBadge(format: TextDocumentFormat): string {
  if (format === "json") return "JSON";
  if (format === "yaml") return "YAML";
  return "TXT";
}

// fallow-ignore-next-line complexity
export function StorageSection({
  entries,
  isLoading,
  onDelete,
  isDeletingEntry,
  onCreate,
  onUpdate,
  onCreateText,
  onReload,
}: StorageSectionProps): JSX.Element {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewEntryPanel, setShowNewEntryPanel] = useState(false);

  const [entryStatuses, setEntryStatuses] = useState<Map<string, "draft" | "saving">>(new Map());
  const [editTexts, setEditTexts] = useState<Map<string, string>>(new Map());
  const [invalidIds, setInvalidIds] = useState<Set<string>>(new Set());
  const saveTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const totalStoredBytes = entries.reduce((sum, e) => sum + JSON.stringify(e.value).length, 0);
  const availableBytes = Math.max(0, MAX_TOTAL_BYTES - totalStoredBytes);

  const keyListEntries = entries.map((e) => ({
    id: eid(e),
    label: e.key,
    isShared: e.shared,
    ...(isFileEntry(e.value)
      ? { fileTypeBadge: fileTypeBadge(e.value.mimeType) }
      : isTextDocumentEntry(e.value)
        ? { fileTypeBadge: documentTypeBadge(e.value.format) }
        : {}),
  }));

  const isDeletingId = isDeletingEntry !== null ? eid(isDeletingEntry) : null;

  const totalCount = keyListEntries.length;
  const keyLabel = `${totalCount} key${totalCount !== 1 ? "s" : ""}`;

  const handleSelectId = useCallback(
    (id: string) => {
      setShowNewEntryPanel(false);
      setSelectedId(id);
      // fallow-ignore-next-line complexity
      setEditTexts((prev) => {
        if (prev.has(id)) return prev;
        const entry = entries.find((e) => eid(e) === id);
        const value = entry?.value ?? {};
        if (isFileEntry(value)) return prev;
        const next = new Map(prev);
        // For text document entries, edit the content directly (not the envelope)
        if (isTextDocumentEntry(value)) {
          next.set(id, value.content);
        } else {
          next.set(id, JSON.stringify(value, null, 2));
        }
        return next;
      });
    },
    [entries],
  );

  const handleEditChange = useCallback(
    // fallow-ignore-next-line complexity
    (id: string, rawText: string) => {
      setEditTexts((prev) => new Map(prev).set(id, rawText));

      // Determine entry type to drive validation and save logic
      const entry = entries.find((e) => eid(e) === id);
      const textDoc = isTextDocumentEntry(entry?.value) ? entry.value : undefined;
      // YAML text docs are never JSON-validated; everything else is
      const validateAsJson = textDoc?.format !== "yaml";

      let isValid = true;
      if (validateAsJson) {
        try {
          JSON.parse(rawText);
        } catch {
          isValid = false;
        }
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
        setEntryStatuses((prev) => new Map(prev).set(id, "saving"));
        const { key, shared } = parseId(id);

        // Build the value to persist
        let valueToSave: unknown;
        if (textDoc !== undefined) {
          // Update the envelope's content, preserving _type / format / createdAt
          valueToSave = { ...textDoc, content: rawText };
        } else {
          valueToSave = JSON.parse(rawText) as unknown;
        }

        void onUpdate(key, valueToSave, shared).then(() => {
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
    [onUpdate, entries],
  );

  const handleOpenNewEntryPanel = useCallback(() => {
    setSelectedId(null);
    setShowNewEntryPanel(true);
  }, []);

  const handleUpload = useCallback(
    async (key: string, fileEntry: FileEntry, shared: boolean) => {
      await onCreate(key, fileEntry, shared);
      setShowNewEntryPanel(false);
      setSelectedId(eid({ key, shared }));
    },
    [onCreate],
  );

  const handleCreateText = useCallback(
    async (key: string, text: string, shared: boolean, format: TextDocumentFormat) => {
      if (onCreateText !== undefined) {
        await onCreateText(key, text, shared, format);
      }
      setShowNewEntryPanel(false);
      setSelectedId(eid({ key, shared }));
    },
    [onCreateText],
  );

  const handleDeleteId = useCallback(
    (id: string) => {
      if (selectedId === id) setSelectedId(null);
      const { key, shared } = parseId(id);
      onDelete(key, shared);
    },
    [selectedId, onDelete],
  );

  const selectedEntry =
    selectedId !== null ? entries.find((e) => eid(e) === selectedId) : undefined;
  const selectedValue = selectedEntry?.value;
  const isSelectedFile = isFileEntry(selectedValue);
  const selectedTextDoc = isTextDocumentEntry(selectedValue) ? selectedValue : undefined;
  const currentEditText =
    !isSelectedFile && selectedId !== null ? editTexts.get(selectedId) : undefined;
  const currentSaveStatus: EntryStatus =
    selectedId !== null ? (entryStatuses.get(selectedId) ?? "saved") : "saved";
  const isCurrentEntryInvalid = selectedId !== null && invalidIds.has(selectedId);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="w-2/5 shrink-0 flex flex-col overflow-hidden">
          <KeyList
            entries={keyListEntries}
            selectedId={selectedId}
            onSelectId={handleSelectId}
            isLoading={isLoading}
            label={keyLabel}
            emptyText="No keys found."
            entryStatuses={entryStatuses}
            onDeleteId={handleDeleteId}
            isDeletingId={isDeletingId}
            onCreateClick={handleOpenNewEntryPanel}
            {...(onReload !== undefined ? { onReloadClick: onReload } : {})}
          />
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          {showNewEntryPanel ? (
            <NewEntryPanel
              existingEntries={entries.map((e) => ({ key: e.key, shared: e.shared }))}
              onUpload={handleUpload}
              onCreateText={handleCreateText}
              onCancel={() => setShowNewEntryPanel(false)}
              availableBytes={availableBytes}
            />
          ) : (
            <KeyContentViewer
              entry={selectedEntry}
              isLoading={isLoading}
              isInvalidJson={isCurrentEntryInvalid}
              saveStatus={currentSaveStatus}
              {...(selectedTextDoc !== undefined ? { format: selectedTextDoc.format } : {})}
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
      <StorageUsageBar entries={entries} />
    </div>
  );
}
