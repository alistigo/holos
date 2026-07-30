import JsonView from "@uiw/react-json-view";
import { lightTheme } from "@uiw/react-json-view/light";
import type React from "react";
import type { JSX } from "react";

export interface JsonDocumentViewerProps {
  value: unknown;
  isLoading: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function JsonDocumentViewer({
  value,
  isLoading,
  onDelete,
  isDeleting = false,
}: JsonDocumentViewerProps): JSX.Element {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-auto p-2 min-h-0">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-1">
            {(["sk-0", "sk-1", "sk-2", "sk-3", "sk-4"] as const).map((id, i) => (
              <div
                key={id}
                className="h-3 bg-gray-100 rounded animate-pulse"
                style={{ width: `${60 + (i % 3) * 15}%` }}
              />
            ))}
          </div>
        ) : value === undefined ? (
          <div className="text-gray-400 text-xs flex items-center justify-center h-full">
            Select a key to inspect its value.
          </div>
        ) : typeof value === "object" && value !== null ? (
          <JsonView value={value as object} style={lightTheme as React.CSSProperties} />
        ) : (
          <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap break-all">
            {String(value)}
          </pre>
        )}
      </div>

      {onDelete !== undefined && value !== undefined && (
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
      )}
    </div>
  );
}
