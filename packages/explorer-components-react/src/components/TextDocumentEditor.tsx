import type { JSX } from "react";

export type TextDocumentFormat = "json" | "yaml" | "plain";

function formatLabel(format: TextDocumentFormat): string {
  if (format === "json") return "JSON";
  if (format === "yaml") return "YAML";
  return "Plain";
}

function SaveStatusChip({ status }: { status: "draft" | "saving" | "saved" }): JSX.Element | null {
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

export interface TextDocumentEditorProps {
  text: string;
  onTextChange: (text: string) => void;
  format: TextDocumentFormat;
  /**
   * Present → create mode: renders a format selector so the user can switch formats.
   * Absent → edit mode: format is shown as a fixed label and cannot be changed.
   */
  onFormatChange?: (format: TextDocumentFormat) => void;
  /** When provided, a Format button appears next to the format selector (create mode only). */
  onFormat?: () => void;
  /** Shown as a save-status chip on the right of the header (edit mode). */
  saveStatus?: "draft" | "saving" | "saved";
  /** Validation error displayed as a banner below the textarea (e.g. JSON parse error). */
  error?: string | null;
  /** Red error message shown below the textarea (e.g. content exceeds per-key size limit). */
  overLimitMessage?: string;
  /** Amber warning shown below the textarea (e.g. not enough remaining storage space). */
  overSpaceMessage?: string;
}

// fallow-ignore-next-line complexity
export function TextDocumentEditor({
  text,
  onTextChange,
  format,
  onFormatChange,
  onFormat,
  saveStatus = "saved",
  error,
  overLimitMessage,
  overSpaceMessage,
}: TextDocumentEditorProps): JSX.Element {
  const isCreateMode = onFormatChange !== undefined;
  const hasError = error != null || overLimitMessage !== undefined;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header bar */}
      <div className="shrink-0 flex items-center gap-2 px-2 py-1 border-b border-gray-100 bg-gray-50">
        {isCreateMode ? (
          <>
            <label htmlFor="text-doc-editor-format" className="text-xs text-gray-500 shrink-0">
              Format
            </label>
            <select
              id="text-doc-editor-format"
              value={format}
              onChange={(e) => onFormatChange(e.target.value as TextDocumentFormat)}
              className="text-xs border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
            >
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
              <option value="plain">Plain text</option>
            </select>
            {onFormat !== undefined && (
              <button
                type="button"
                onClick={onFormat}
                disabled={format !== "json"}
                title={format !== "json" ? "Format only available for JSON" : undefined}
                className="text-xs px-2 py-0.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Format
              </button>
            )}
          </>
        ) : (
          <>
            <span className="text-xs text-gray-400 font-mono flex-1">{formatLabel(format)}</span>
            {onFormat !== undefined && (
              <button
                type="button"
                onClick={onFormat}
                disabled={format !== "json"}
                title={format !== "json" ? "Format only available for JSON" : undefined}
                className="text-xs px-2 py-0.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Format
              </button>
            )}
            <SaveStatusChip status={saveStatus} />
          </>
        )}
      </div>

      {/* Textarea */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          spellCheck={false}
          className={`absolute inset-0 w-full h-full resize-none text-xs font-mono p-2 leading-relaxed focus:outline-none bg-white ${
            hasError
              ? "ring-1 ring-red-400 bg-red-50 focus:ring-red-400"
              : "focus:ring-1 focus:ring-blue-300"
          }`}
        />
      </div>

      {/* Error / warning banners */}
      {error != null && (
        <p className="shrink-0 px-2 py-1 text-xs text-red-500 bg-red-50 border-t border-red-200 font-mono truncate">
          {error}
        </p>
      )}
      {overLimitMessage !== undefined && (
        <p className="shrink-0 px-2 py-1 text-xs text-red-600 bg-red-50 border-t border-red-200">
          {overLimitMessage}
        </p>
      )}
      {overSpaceMessage !== undefined && (
        <p className="shrink-0 px-2 py-1 text-xs text-amber-700 bg-amber-50 border-t border-amber-200">
          {overSpaceMessage}
        </p>
      )}
    </div>
  );
}
