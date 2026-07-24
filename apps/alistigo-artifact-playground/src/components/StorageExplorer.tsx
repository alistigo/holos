import JsonView from "@uiw/react-json-view";
import { lightTheme } from "@uiw/react-json-view/light";
import type React from "react";
import type { JSX } from "react";
import { useState } from "react";

export interface StorageExplorerProps {
  localEntries: [string, string][];
  claudeEntries: [string, string][];
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
  label,
  entries,
  emptyText,
}: {
  label: string;
  entries: [string, string][];
  emptyText: string;
}): JSX.Element {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const selectedValue =
    selectedKey !== null ? entries.find(([k]) => k === selectedKey)?.[1] : undefined;

  const parsedValue = selectedValue !== undefined ? parseValue(selectedValue) : undefined;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="px-3 py-1 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0">
        {label}
      </div>
      {entries.length === 0 ? (
        <div className="flex items-center justify-center flex-1 text-gray-400 text-xs p-4">
          {emptyText}
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden min-h-0">
          <div className="w-2/5 border-r border-gray-100 overflow-y-auto shrink-0">
            <ul className="py-1">
              {entries.map(([key]) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => setSelectedKey(key)}
                    className={`w-full text-left px-3 py-1.5 text-xs font-mono truncate cursor-pointer transition-colors ${
                      selectedKey === key
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    title={key}
                  >
                    {key}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {parsedValue !== undefined ? (
              typeof parsedValue === "object" && parsedValue !== null ? (
                <JsonView value={parsedValue as object} style={lightTheme as React.CSSProperties} />
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
        </div>
      )}
    </div>
  );
}

export function StorageExplorer({
  localEntries,
  claudeEntries,
}: StorageExplorerProps): JSX.Element {
  return (
    <div className="flex flex-col h-full overflow-hidden divide-y divide-gray-200">
      <StorageSection
        label="Local Storage"
        entries={localEntries}
        emptyText="No localStorage entries — interact with the artifact."
      />
      <StorageSection
        label="Claude Storage (simulated)"
        entries={claudeEntries}
        emptyText="No Claude storage entries — set AI context to 'claude'."
      />
    </div>
  );
}
