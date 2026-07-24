import type { JSX } from "react";
import { useState } from "react";
import { allExpanded, defaultStyles, JsonView } from "react-json-view-lite";

export interface StorageExplorerProps {
  entries: [string, string][];
}

function parseValue(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

export function StorageExplorer({ entries }: StorageExplorerProps): JSX.Element {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const selectedValue =
    selectedKey !== null ? entries.find(([k]) => k === selectedKey)?.[1] : undefined;

  const parsedValue = selectedValue !== undefined ? parseValue(selectedValue) : undefined;

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-xs">
        Storage is empty — interact with the artifact to populate it.
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-2/5 border-r border-gray-200 overflow-y-auto shrink-0">
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
            <JsonView
              data={parsedValue as object}
              style={defaultStyles}
              shouldExpandNode={allExpanded}
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
    </div>
  );
}
