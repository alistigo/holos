import type { JSX } from "react";
import { useCallback, useState } from "react";
import type { FileEntry } from "./FileUploadForm.js";
import { FileUploadForm } from "./FileUploadForm.js";
import type { TextDocumentFormat } from "./TextDocumentEditor.js";
import { TextDocumentEditor } from "./TextDocumentEditor.js";

const MIB = 1024 * 1024;
const DEFAULT_MAX_PER_KEY_BYTES = 5 * MIB;

type EntryTab = "file" | "text";

export interface NewEntryPanelProps {
  existingEntries: { key: string; shared: boolean }[];
  onUpload: (key: string, fileEntry: FileEntry, shared: boolean) => Promise<void>;
  onCreateText: (key: string, text: string, shared: boolean) => Promise<void>;
  onCancel: () => void;
  /** Free bytes remaining before hitting the artifact's total storage cap. */
  availableBytes?: number;
  /** Per-key ceiling in bytes. Default: 5 MiB. */
  maxPerKeyBytes?: number;
}

function validateJson(text: string): string | null {
  try {
    JSON.parse(text);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "Invalid JSON";
  }
}

// fallow-ignore-next-line complexity
function formatText(
  text: string,
  format: TextDocumentFormat,
): { result: string; error: string | null } {
  if (format === "json") {
    try {
      return { result: JSON.stringify(JSON.parse(text), null, 2), error: null };
    } catch (e) {
      return { result: text, error: e instanceof Error ? e.message : "Invalid JSON" };
    }
  }
  if (format === "plain") {
    return { result: text.trim(), error: null };
  }
  return { result: text, error: null };
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-3 py-1.5 font-medium transition-colors border-b-2 ${
        active
          ? "border-blue-600 text-blue-700"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

function formatMib(bytes: number): string {
  return `${(bytes / MIB).toFixed(2)} MiB`;
}

// fallow-ignore-next-line complexity
export function NewEntryPanel({
  existingEntries,
  onUpload,
  onCreateText,
  onCancel,
  availableBytes,
  maxPerKeyBytes = DEFAULT_MAX_PER_KEY_BYTES,
}: NewEntryPanelProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<EntryTab>("file");
  const [shared, setShared] = useState(false);

  const [textKey, setTextKey] = useState("");
  const [textFormat, setTextFormat] = useState<TextDocumentFormat>("json");
  const [textContent, setTextContent] = useState("{}");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isFull = availableBytes !== undefined && availableBytes <= 0;

  const textKeyTrimmed = textKey.trim();
  const keyExists = existingEntries.some((e) => e.key === textKeyTrimmed && e.shared === shared);

  const textStoredBytes = new TextEncoder().encode(textContent).length;
  const isTextOverPerKey = textStoredBytes >= maxPerKeyBytes;
  const isTextOverSpace =
    !isFull && availableBytes !== undefined && textStoredBytes > availableBytes;

  const canSave =
    textKeyTrimmed !== "" &&
    !keyExists &&
    !isSaving &&
    !isFull &&
    !isTextOverPerKey &&
    !isTextOverSpace &&
    (textFormat !== "json" || jsonError === null);

  const handleTextChange = useCallback(
    (text: string) => {
      setTextContent(text);
      if (textFormat === "json") setJsonError(validateJson(text));
      else setJsonError(null);
    },
    [textFormat],
  );

  const handleFormatChange = useCallback((format: TextDocumentFormat) => {
    setTextFormat(format);
    setTextContent(format === "json" ? "{}" : "");
    setJsonError(null);
  }, []);

  const handleFormat = useCallback(() => {
    const { result, error } = formatText(textContent, textFormat);
    setTextContent(result);
    setJsonError(error);
  }, [textContent, textFormat]);

  const handleSaveText = useCallback(async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      await onCreateText(textKeyTrimmed, textContent, shared);
      onCancel();
    } finally {
      setIsSaving(false);
    }
  }, [canSave, onCreateText, textKeyTrimmed, textContent, shared, onCancel]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          New entry
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 text-xs px-1 py-0.5 rounded hover:bg-gray-200 transition-colors"
          aria-label="Cancel"
        >
          ✕
        </button>
      </div>

      {/* Shared checkbox + tab selector */}
      <div className="shrink-0 flex items-center gap-4 px-3 border-b border-gray-200">
        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer shrink-0 py-2">
          <input
            type="checkbox"
            checked={shared}
            onChange={(e) => setShared(e.target.checked)}
            className="accent-purple-500"
          />
          Shared
        </label>
        <div className="flex items-center gap-0">
          <TabButton
            label="File"
            active={activeTab === "file"}
            onClick={() => setActiveTab("file")}
          />
          <TabButton
            label="Text document"
            active={activeTab === "text"}
            onClick={() => setActiveTab("text")}
          />
        </div>
      </div>

      {/* File tab */}
      {activeTab === "file" && (
        <FileUploadForm
          onUpload={onUpload}
          onCancel={onCancel}
          externalShared={shared}
          hideHeader
          {...(availableBytes !== undefined ? { availableBytes } : {})}
        />
      )}

      {/* Text document tab */}
      {activeTab === "text" && (
        <div className="flex flex-col flex-1 overflow-hidden p-3 gap-3">
          {isFull && (
            <div className="shrink-0 rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
              <p className="font-semibold mb-0.5">Storage full</p>
              <p>
                This artifact has reached its 17 MiB storage limit. Delete existing keys to free
                space.
              </p>
            </div>
          )}

          {/* Key name */}
          <div className="shrink-0">
            <label htmlFor="new-entry-key" className="block text-xs text-gray-500 mb-1">
              Key name
            </label>
            <input
              id="new-entry-key"
              // biome-ignore lint/a11y/noAutofocus: intentional — user just opened the panel
              autoFocus
              type="text"
              value={textKey}
              onChange={(e) => setTextKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSaveText();
              }}
              placeholder="e.g. my-document"
              className="w-full text-xs font-mono border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            {keyExists && <p className="mt-0.5 text-[10px] text-red-600">Key already exists</p>}
          </div>

          {/* Shared text editor — format selector lives in its header */}
          <TextDocumentEditor
            text={textContent}
            onTextChange={handleTextChange}
            format={textFormat}
            onFormatChange={handleFormatChange}
            onFormat={handleFormat}
            error={jsonError}
            {...(isTextOverPerKey
              ? {
                  overLimitMessage: `Content too large — ${formatMib(textStoredBytes)} exceeds the ${formatMib(maxPerKeyBytes)} per-key limit.`,
                }
              : {})}
            {...(isTextOverSpace && availableBytes !== undefined
              ? {
                  overSpaceMessage: `Not enough space — ${formatMib(textStoredBytes)} needed, ${formatMib(availableBytes)} available.`,
                }
              : {})}
          />

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void handleSaveText()}
              disabled={!canSave}
              className="flex-1 text-xs py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSaving ? "Creating…" : "Create"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
