import type { JSX } from "react";

export interface KeyListProps {
  keys: string[];
  selectedKey: string | null;
  onSelectKey: (key: string) => void;
  isLoading: boolean;
  label: string;
  emptyText?: string;
  entryStatuses?: Map<string, "draft" | "saving">;
  onCreateClick?: () => void;
}

function StatusBadge({ status }: { status: "draft" | "saving" }): JSX.Element {
  if (status === "saving") {
    return (
      <span
        className="inline-block w-2.5 h-2.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin shrink-0"
        aria-label="Saving"
      />
    );
  }
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
      aria-label="Unsaved"
    />
  );
}

export function KeyList({
  keys,
  selectedKey,
  onSelectKey,
  isLoading,
  label,
  emptyText = "No keys found.",
  entryStatuses,
  onCreateClick,
}: KeyListProps): JSX.Element {
  return (
    <div className="flex flex-col h-full overflow-hidden border-r border-gray-100">
      <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0 flex items-center gap-1">
        <span className="flex-1">{label}</span>
        {onCreateClick !== undefined && (
          <button
            type="button"
            onClick={onCreateClick}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded px-1 py-0.5 transition-colors leading-none font-bold text-sm"
            title="Create entry"
            aria-label="Create entry"
          >
            +
          </button>
        )}
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
          {keys.map((key) => {
            const status = entryStatuses?.get(key);
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => onSelectKey(key)}
                  className={`w-full text-left px-3 py-1.5 text-xs font-mono cursor-pointer transition-colors flex items-center gap-1.5 ${
                    selectedKey === key
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  title={key}
                >
                  <span className="truncate flex-1">{key}</span>
                  {status !== undefined && <StatusBadge status={status} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
