import JsonView from "@uiw/react-json-view";
import { lightTheme } from "@uiw/react-json-view/light";
import type React from "react";
import type { JSX } from "react";
import { useState } from "react";

export interface StorageExplorerProps {
  aiContext: string;
  localEntries: [string, string][];
  privateEntries: [string, string][];
  sharedEntries: [string, string][];
  simulatorDelayMs: number;
  onSimulatorDelayChange: (ms: number) => void;
  onDeleteEntry?: (key: string, shared: boolean) => void;
  onSetEntry?: (key: string, value: string, shared: boolean) => void;
  onClearAll?: () => void;
}

type EntryItem = { key: string; value: string; shared: boolean };

function entryId(entry: EntryItem): string {
  return `${entry.shared ? "s" : "p"}:${entry.key}`;
}

function parseValue(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

// fallow-ignore-next-line complexity
function StorageSection({
  entries,
  emptyText,
  onDeleteEntry,
  onSetEntry,
}: {
  entries: EntryItem[];
  emptyText: string;
  onDeleteEntry?: (key: string, shared: boolean) => void;
  onSetEntry?: (key: string, value: string, shared: boolean) => void;
}): JSX.Element {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState("");
  const [isInvalidJson, setIsInvalidJson] = useState(false);

  const selectedEntry =
    selectedId !== null ? entries.find((e) => entryId(e) === selectedId) : undefined;
  const parsedValue = selectedEntry !== undefined ? parseValue(selectedEntry.value) : undefined;

  function selectEntry(entry: EntryItem): void {
    setSelectedId(entryId(entry));
    setEditMode(false);
    setIsInvalidJson(false);
  }

  function enterEditMode(): void {
    if (!selectedEntry) return;
    setEditText(selectedEntry.value);
    setIsInvalidJson(false);
    setEditMode(true);
  }

  function handleEditTextChange(text: string): void {
    setEditText(text);
    try {
      JSON.parse(text);
      setIsInvalidJson(false);
      if (selectedEntry) {
        onSetEntry?.(selectedEntry.key, text, selectedEntry.shared);
      }
    } catch {
      setIsInvalidJson(true);
    }
  }

  function handleDelete(entry: EntryItem): void {
    if (selectedId === entryId(entry)) {
      setSelectedId(null);
      setEditMode(false);
    }
    onDeleteEntry?.(entry.key, entry.shared);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {entries.length === 0 ? (
        <div className="flex items-center justify-center flex-1 text-gray-400 text-xs p-4">
          {emptyText}
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Key list */}
          <div className="w-2/5 border-r border-gray-100 overflow-y-auto shrink-0">
            <ul className="py-1">
              {entries.map((entry) => {
                const isSelected = selectedId === entryId(entry);
                return (
                  <li key={entryId(entry)} className="group flex items-center">
                    <button
                      type="button"
                      onClick={() => selectEntry(entry)}
                      className={`flex-1 min-w-0 text-left px-3 py-1.5 text-xs font-mono cursor-pointer transition-colors flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      title={entry.key}
                    >
                      <span className="truncate flex-1">{entry.key}</span>
                      {entry.shared && (
                        <span className="shrink-0 text-[10px] font-semibold text-purple-500 bg-purple-50 rounded px-1 leading-none py-0.5">
                          S
                        </span>
                      )}
                    </button>
                    {onDeleteEntry !== undefined && (
                      <button
                        type="button"
                        onClick={() => handleDelete(entry)}
                        className="shrink-0 px-2 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete"
                        aria-label={`Delete ${entry.key}`}
                      >
                        ×
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
          {/* JSON viewer */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="shrink-0 flex items-center gap-2 px-2 py-1 border-b border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-400 font-mono truncate flex-1">
                {selectedEntry?.key ?? "—"}
              </span>
              {selectedEntry !== undefined && onSetEntry !== undefined && (
                <button
                  type="button"
                  onClick={editMode ? () => setEditMode(false) : enterEditMode}
                  className="shrink-0 text-xs px-1.5 py-0.5 rounded border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {editMode ? "View" : "Edit"}
                </button>
              )}
            </div>
            {editMode ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <textarea
                  value={editText}
                  onChange={(e) => handleEditTextChange(e.target.value)}
                  spellCheck={false}
                  className={`flex-1 resize-none text-xs font-mono p-2 focus:outline-none bg-white ${
                    isInvalidJson
                      ? "ring-1 ring-red-400 bg-red-50"
                      : "focus:ring-1 focus:ring-blue-300"
                  }`}
                />
                {isInvalidJson && (
                  <div className="shrink-0 px-2 py-1 text-xs text-red-500 bg-red-50 border-t border-red-200">
                    Invalid JSON
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-auto p-2">
                {parsedValue !== undefined ? (
                  typeof parsedValue === "object" && parsedValue !== null ? (
                    <JsonView
                      value={parsedValue as object}
                      style={lightTheme as React.CSSProperties}
                    />
                  ) : (
                    <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap break-all">
                      {String(parsedValue)}
                    </pre>
                  )
                ) : (
                  <div className="text-gray-400 text-xs flex items-center justify-center h-full">
                    Select a key to inspect its value.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function StorageExplorer({
  aiContext,
  localEntries,
  privateEntries,
  sharedEntries,
  simulatorDelayMs,
  onSimulatorDelayChange,
  onDeleteEntry,
  onSetEntry,
  onClearAll,
}: StorageExplorerProps): JSX.Element {
  const claudeEntries: EntryItem[] = [
    ...privateEntries.map(([key, value]) => ({ key, value, shared: false })),
    ...sharedEntries.map(([key, value]) => ({ key, value, shared: true })),
  ];
  const localItems: EntryItem[] = localEntries.map(([key, value]) => ({
    key,
    value,
    shared: false,
  }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Simulator controls */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50">
        <span className="text-xs text-gray-500 shrink-0">Simulator delay</span>
        <input
          type="number"
          min={0}
          max={5000}
          step={100}
          value={simulatorDelayMs}
          onChange={(e) => onSimulatorDelayChange(Math.max(0, Number(e.target.value)))}
          className="w-20 text-xs border border-gray-200 rounded px-2 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <span className="text-xs text-gray-400">ms</span>
        {aiContext === "claude" && onClearAll !== undefined && (
          <button
            type="button"
            onClick={onClearAll}
            className="ml-auto text-xs px-2 py-1 text-red-500 border border-red-200 rounded hover:bg-red-50 transition-colors shrink-0"
          >
            Delete all
          </button>
        )}
      </div>
      {aiContext === "claude" ? (
        <StorageSection
          entries={claudeEntries}
          emptyText="No Claude storage entries yet — interact with the artifact."
          {...(onDeleteEntry !== undefined ? { onDeleteEntry } : {})}
          {...(onSetEntry !== undefined ? { onSetEntry } : {})}
        />
      ) : (
        <StorageSection
          entries={localItems}
          emptyText="No localStorage entries yet — interact with the artifact."
        />
      )}
    </div>
  );
}
