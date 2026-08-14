import JsonView from "@uiw/react-json-view";
import { lightTheme } from "@uiw/react-json-view/light";
import type React from "react";
import type { JSX } from "react";
import { useCallback } from "react";
import type { TextDocumentFormat } from "./TextDocumentEditor.js";
import { TextDocumentEditor } from "./TextDocumentEditor.js";

export type EntryStatus = "draft" | "saving" | "saved";

export interface JsonDocumentViewerProps {
  value: unknown;
  isLoading: boolean;
  /** When provided together with onEditTextChange, switches to edit mode. */
  editText?: string;
  onEditTextChange?: (text: string) => void;
  isInvalidJson?: boolean;
  saveStatus?: EntryStatus;
  /** Format shown in the editor header when in edit mode. Defaults to "json". */
  format?: TextDocumentFormat;
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

// fallow-ignore-next-line complexity
export function JsonDocumentViewer({
  value,
  isLoading,
  editText,
  onEditTextChange,
  isInvalidJson = false,
  saveStatus = "saved",
  format = "json",
}: JsonDocumentViewerProps): JSX.Element {
  const isEditable = editText !== undefined && onEditTextChange !== undefined;

  const handleFormat = useCallback(() => {
    if (format !== "json" || editText === undefined || onEditTextChange === undefined) return;
    try {
      onEditTextChange(JSON.stringify(JSON.parse(editText), null, 2));
    } catch {
      // invalid JSON — leave as-is
    }
  }, [format, editText, onEditTextChange]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {isLoading ? (
          <SkeletonRows />
        ) : isEditable ? (
          <TextDocumentEditor
            text={editText}
            onTextChange={onEditTextChange}
            format={format}
            saveStatus={saveStatus}
            error={isInvalidJson ? "Invalid JSON — fix to auto-save" : null}
            onFormat={handleFormat}
          />
        ) : (
          <div className="flex-1 overflow-auto p-2">
            <ValueContent value={value} />
          </div>
        )}
      </div>
    </div>
  );
}
