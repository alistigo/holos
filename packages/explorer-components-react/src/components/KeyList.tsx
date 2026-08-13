import type { JSX } from "react";

export interface KeyListEntry {
  id: string;
  label: string;
  isShared: boolean;
  fileTypeBadge?: string;
}

export interface KeyListProps {
  entries: KeyListEntry[];
  selectedId: string | null;
  onSelectId: (id: string) => void;
  isLoading: boolean;
  label: string;
  emptyText?: string;
  entryStatuses?: Map<string, "draft" | "saving">;
  onCreateClick?: () => void;
  onUploadClick?: () => void;
  onReloadClick?: () => void;
  onDeleteId?: (id: string) => void;
  isDeletingId?: string | null;
}

function StatusBadge({ status }: { status: "draft" | "saving" }): JSX.Element {
  if (status === "saving") {
    return (
      <span
        role="img"
        className="inline-block w-2.5 h-2.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin shrink-0"
        aria-label="Saving"
      />
    );
  }
  return (
    <span
      role="img"
      className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
      aria-label="Unsaved"
    />
  );
}

// fallow-ignore-next-line complexity
function KeyListRow({
  entry,
  selectedId,
  status,
  isDeleting,
  onSelectId,
  onDeleteId,
}: {
  entry: KeyListEntry;
  selectedId: string | null;
  status: "draft" | "saving" | undefined;
  isDeleting: boolean;
  onSelectId: (id: string) => void;
  onDeleteId: ((id: string) => void) | undefined;
}): JSX.Element {
  return (
    <li className="group flex items-center">
      <button
        type="button"
        onClick={() => onSelectId(entry.id)}
        className={`flex-1 min-w-0 text-left px-3 py-1.5 text-xs font-mono cursor-pointer transition-colors flex items-center gap-1.5 ${
          selectedId === entry.id
            ? "bg-blue-50 text-blue-700 font-semibold"
            : "text-gray-700 hover:bg-gray-100"
        }`}
        title={entry.label}
      >
        <span className="truncate flex-1">{entry.label}</span>
        {entry.fileTypeBadge !== undefined && (
          <span className="shrink-0 text-[10px] font-semibold text-teal-700 bg-teal-50 rounded px-1 leading-none py-0.5">
            {entry.fileTypeBadge}
          </span>
        )}
        {entry.isShared && (
          <span className="shrink-0 text-[10px] font-semibold text-purple-500 bg-purple-50 rounded px-1 leading-none py-0.5">
            S
          </span>
        )}
        {status !== undefined && <StatusBadge status={status} />}
      </button>
      {onDeleteId !== undefined && (
        <button
          type="button"
          onClick={() => onDeleteId(entry.id)}
          disabled={isDeleting}
          className="shrink-0 px-2 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors opacity-0 group-hover:opacity-100"
          title="Delete"
          aria-label={`Delete ${entry.label}`}
        >
          {isDeleting ? (
            <span
              role="img"
              className="inline-block w-2.5 h-2.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin"
              aria-label="Deleting"
            />
          ) : (
            "×"
          )}
        </button>
      )}
    </li>
  );
}

// fallow-ignore-next-line complexity
export function KeyList({
  entries,
  selectedId,
  onSelectId,
  isLoading,
  label,
  emptyText = "No keys found.",
  entryStatuses,
  onCreateClick,
  onUploadClick,
  onReloadClick,
  onDeleteId,
  isDeletingId,
}: KeyListProps): JSX.Element {
  return (
    <div className="flex flex-col h-full overflow-hidden border-r border-gray-100">
      <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0 flex items-center gap-1.5">
        <span className="flex-1">{label}</span>
        {onReloadClick !== undefined && (
          <button
            type="button"
            onClick={onReloadClick}
            className="normal-case tracking-normal font-medium text-xs px-1.5 py-0.5 border border-gray-200 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0"
            title="Reload"
            aria-label="Reload"
          >
            Reload
          </button>
        )}
        {onUploadClick !== undefined && (
          <button
            type="button"
            onClick={onUploadClick}
            className="normal-case tracking-normal font-medium text-xs px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-blue-700 hover:bg-blue-100 transition-colors shrink-0"
            title="Upload file"
            aria-label="Upload file"
          >
            ↑ Upload
          </button>
        )}
        {onCreateClick !== undefined && (
          <button
            type="button"
            onClick={onCreateClick}
            className="normal-case tracking-normal font-medium text-xs px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-600 hover:bg-gray-200 transition-colors shrink-0"
            title="Create entry"
            aria-label="Create entry"
          >
            + New
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
      ) : entries.length === 0 ? (
        <div className="flex items-center justify-center flex-1 text-gray-400 text-xs p-4 text-center">
          {emptyText}
        </div>
      ) : (
        <ul className="py-1 overflow-y-auto flex-1">
          {entries.map((entry) => (
            <KeyListRow
              key={entry.id}
              entry={entry}
              selectedId={selectedId}
              status={entryStatuses?.get(entry.id)}
              isDeleting={isDeletingId === entry.id}
              onSelectId={onSelectId}
              onDeleteId={onDeleteId}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
