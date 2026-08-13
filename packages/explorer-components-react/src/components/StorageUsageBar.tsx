import type { JSX } from "react";

export interface StorageUsageBarProps {
  entries: { value: unknown }[];
  maxPerKeyMb?: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// fallow-ignore-next-line complexity
export function StorageUsageBar({ entries, maxPerKeyMb = 5 }: StorageUsageBarProps): JSX.Element {
  const maxBytes = maxPerKeyMb * 1024 * 1024;

  const entrySizes = entries.map((e) => JSON.stringify(e.value).length);
  const totalBytes = entrySizes.reduce((sum, n) => sum + n, 0);
  const largestBytes = entrySizes.length > 0 ? Math.max(...entrySizes) : 0;

  const pct = Math.min((largestBytes / maxBytes) * 100, 100);
  const barColor = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-400" : "bg-green-500";

  return (
    <div className="px-3 py-2 border-b border-gray-100 bg-white shrink-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-gray-500">
          {formatBytes(totalBytes)} total &middot; {entries.length} key
          {entries.length !== 1 ? "s" : ""}
        </span>
        <span className="text-[10px] text-gray-400">{maxPerKeyMb} MB max per key</span>
      </div>
      <div
        className="h-1 rounded-full bg-gray-100 overflow-hidden"
        title={`Largest key: ${formatBytes(largestBytes)}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {largestBytes > 0 && (
        <p className="mt-0.5 text-[10px] text-gray-400 text-right">
          Largest key: {formatBytes(largestBytes)}
        </p>
      )}
    </div>
  );
}
