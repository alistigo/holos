import type { JSX } from "react";

export interface KeyListProps {
  keys: string[];
  selectedKey: string | null;
  onSelectKey: (key: string) => void;
  isLoading: boolean;
  label: string;
  emptyText?: string;
}

export function KeyList({
  keys,
  selectedKey,
  onSelectKey,
  isLoading,
  label,
  emptyText = "No keys found.",
}: KeyListProps): JSX.Element {
  return (
    <div className="flex flex-col h-full overflow-hidden border-r border-gray-100">
      <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0">
        {label}
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-1.5 p-2 flex-1">
          {Array.from({ length: 4 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: stable skeleton
            <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <div className="flex items-center justify-center flex-1 text-gray-400 text-xs p-4 text-center">
          {emptyText}
        </div>
      ) : (
        <ul className="py-1 overflow-y-auto flex-1">
          {keys.map((key) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => onSelectKey(key)}
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
      )}
    </div>
  );
}
