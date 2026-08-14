import JsonView from "@uiw/react-json-view";
import { lightTheme } from "@uiw/react-json-view/light";
import type React from "react";
import type { JSX } from "react";
import { useState } from "react";
import type { EntryStatus } from "./DocumentViewer.js";
import { DocumentViewer } from "./DocumentViewer.js";
import type { FileEntry } from "./FileUploadForm.js";
import { FileViewer } from "./FileViewer.js";
import type { TextDocumentFormat } from "./TextDocumentEditor.js";

interface KeyEntry {
  key: string;
  value: unknown;
  shared: boolean;
}

function isFileEntry(value: unknown): value is FileEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "_type" in value &&
    (value as Record<string, unknown>)._type === "file"
  );
}

type Tab = "view" | "raw";

export interface KeyContentViewerProps {
  entry: KeyEntry | undefined;
  isLoading: boolean;
  editText?: string;
  onEditTextChange?: (text: string) => void;
  isInvalidJson?: boolean;
  saveStatus?: EntryStatus;
  format?: TextDocumentFormat;
}

function TabBar({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }): JSX.Element {
  return (
    <div className="shrink-0 flex border-b border-gray-100 bg-gray-50">
      {(["view", "raw"] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`px-3 py-1 text-xs font-medium transition-colors ${
            active === tab
              ? "border-b-2 border-blue-500 text-blue-600 bg-white -mb-px"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          {tab === "view" ? "View" : "Raw"}
        </button>
      ))}
    </div>
  );
}

function RawView({ entry }: { entry: KeyEntry }): JSX.Element {
  const display = { key: entry.key, shared: entry.shared, value: entry.value };
  return (
    <div className="flex-1 overflow-auto p-2">
      <JsonView value={display as unknown as object} style={lightTheme as React.CSSProperties} />
    </div>
  );
}

// fallow-ignore-next-line complexity
export function KeyContentViewer({
  entry,
  isLoading,
  editText,
  onEditTextChange,
  isInvalidJson = false,
  saveStatus = "saved",
  format = "json",
}: KeyContentViewerProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>("view");

  const isFile = entry !== undefined && isFileEntry(entry.value);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {entry !== undefined && <TabBar active={activeTab} onChange={setActiveTab} />}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {activeTab === "raw" && entry !== undefined ? (
          <RawView entry={entry} />
        ) : isFile && entry !== undefined ? (
          <FileViewer entry={entry as KeyEntry & { value: FileEntry }} />
        ) : (
          <DocumentViewer
            value={entry?.value}
            isLoading={isLoading}
            isInvalidJson={isInvalidJson}
            saveStatus={saveStatus}
            format={format}
            {...(editText !== undefined && onEditTextChange !== undefined
              ? { editText, onEditTextChange }
              : {})}
          />
        )}
      </div>
    </div>
  );
}
