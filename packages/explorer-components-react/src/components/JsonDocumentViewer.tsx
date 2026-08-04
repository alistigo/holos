import JsonView from "@uiw/react-json-view";
import { lightTheme } from "@uiw/react-json-view/light";
import type React from "react";
import type { JSX } from "react";

export type EntryStatus = "draft" | "saving" | "saved";

export interface JsonDocumentViewerProps {
  value: unknown;
  isLoading: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
  // editing support
  editText?: string;
  onEditTextChange?: (text: string) => void;
  isInvalidJson?: boolean;
  saveStatus?: EntryStatus;
}

const SKELETON_IDS = ["sk-0", "sk-1", "sk-2", "sk-3", "sk-4"] as const;
const SKELETON_WIDTHS = [60, 75, 90, 60, 75] as const;

function SkeletonRows(): JSX.Element {
  return (
    <div className="flex flex-col gap-2 p-1">
      {SKELETON_IDS.map((id, i) => (
        <div
          key={id}
          className="h-3 bg-gray-100 rounded animate-pulse"
          style={{ width: `${SKELETON_WIDTHS[i]}%` }}
        />
      ))}
    </div>
  );
}

function SaveStatusChip({ status }: { status: EntryStatus }): JSX.Element | null {
  if (status === "saved") return null;
  if (status === "saving") {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">
        <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        Saving…
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-600 font-medium">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
      Unsaved
    </div>
  );
}

function EditableTextArea({
  editText,
  onEditTextChange,
  isInvalidJson,
  saveStatus,
}: {
  editText: string;
  onEditTextChange: (text: string) => void;
  isInvalidJson: boolean;
  saveStatus: EntryStatus;
}): JSX.Element {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 flex items-center justify-between px-2 py-1 border-b border-gray-100 bg-gray-50">
        <span className="text-xs text-gray-400 font-mono">JSON</span>
        <SaveStatusChip status={saveStatus} />
      </div>
      <div className="flex-1 overflow-hidden relative">
        <textarea
          value={editText}
          onChange={(e) => onEditTextChange(e.target.value)}
          spellCheck={false}
          className={`absolute inset-0 w-full h-full resize-none text-xs font-mono p-2 focus:outline-none bg-white ${
            isInvalidJson
              ? "ring-1 ring-red-400 bg-red-50"
              : "focus:ring-1 focus:ring-blue-300"
          }`}
        />
      </div>
      {isInvalidJson && (
        <div className="shrink-0 px-2 py-1 text-xs text-red-500 bg-red-50 border-t border-red-200">
          Invalid JSON — fix to auto-save
        </div>
      )}
    </div>
  );
}

function ValueContent({ value }: { value: unknown }): JSX.Element {
  if (value === undefined) {
    return (
      <div className="text-gray-400 text-xs flex items-center justify-center h-full">
        Select a key to inspect its value.
      </div>
    );
  }
  if (typeof value === "object" && value !== null) {
    return <JsonView value={value as object} style={lightTheme as React.CSSProperties} />;
  }
  return (
    <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap break-all">
      {String(value)}
    </pre>
  );
}

function DeleteButton({
  onDelete,
  isDeleting,
  isLoading,
}: {
  onDelete: () => void;
  isDeleting: boolean;
  isLoading: boolean;
}): JSX.Element {
  return (
    <div className="shrink-0 px-3 py-2 border-t border-gray-100">
      <button
        type="button"
        onClick={onDelete}
        disabled={isDeleting || isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
      >
        {isDeleting ? (
          <>
            <span className="inline-block w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            Deleting…
          </>
        ) : (
          "Delete key"
        )}
      </button>
    </div>
  );
}

export function JsonDocumentViewer({
  value,
  isLoading,
  onDelete,
  isDeleting = false,
  editText,
  onEditTextChange,
  isInvalidJson = false,
  saveStatus = "saved",
}: JsonDocumentViewerProps): JSX.Element {
  const isEditable = editText !== undefined && onEditTextChange !== undefined;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-auto min-h-0">
        {isLoading ? (
          <SkeletonRows />
        ) : isEditable ? (
          <EditableTextArea
            editText={editText}
            onEditTextChange={onEditTextChange}
            isInvalidJson={isInvalidJson}
            saveStatus={saveStatus}
          />
        ) : (
          <div className="p-2 h-full">
            <ValueContent value={value} />
          </div>
        )}
      </div>
      {onDelete !== undefined && value !== undefined && (
        <DeleteButton onDelete={onDelete} isDeleting={isDeleting} isLoading={isLoading} />
      )}
    </div>
  );
}
