import type { JSX } from "react";
import { useState } from "react";
import { JsonDocumentViewer } from "./JsonDocumentViewer.js";
import { KeyList } from "./KeyList.js";

export interface StorageSectionProps {
  label: string;
  entries: Record<string, unknown>;
  isLoading: boolean;
  onDelete: (key: string) => void;
  isDeletingKey: string | null;
}

export function StorageSection({
  label,
  entries,
  isLoading,
  onDelete,
  isDeletingKey,
}: StorageSectionProps): JSX.Element {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const keys = Object.keys(entries);
  const selectedValue = selectedKey !== null ? entries[selectedKey] : undefined;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="px-3 py-1 bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wide shrink-0">
        {label}
      </div>
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="w-2/5 shrink-0 flex flex-col overflow-hidden">
          <KeyList
            keys={keys}
            selectedKey={selectedKey}
            onSelectKey={setSelectedKey}
            isLoading={isLoading}
            label={`${keys.length} key${keys.length !== 1 ? "s" : ""}`}
            emptyText="No keys found."
          />
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          <JsonDocumentViewer
            value={selectedValue}
            isLoading={isLoading}
            {...(selectedKey !== null
              ? { onDelete: () => onDelete(selectedKey), isDeleting: isDeletingKey === selectedKey }
              : {})}
          />
        </div>
      </div>
    </div>
  );
}
