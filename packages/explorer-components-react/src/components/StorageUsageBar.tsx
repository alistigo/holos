import type { JSX } from "react";

const MIB = 1024 * 1024;

export interface StorageUsageBarProps {
  entries: { value: unknown }[];
  /** Per-key size ceiling in MiB (exclusive). Default: 5 */
  maxPerKeyMib?: number;
  /** Total artifact storage ceiling in MiB. Default: 17 */
  maxTotalMib?: number;
}

function formatMib(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MIB) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / MIB).toFixed(2)} MiB`;
}

// fallow-ignore-next-line complexity
export function StorageUsageBar({
  entries,
  maxPerKeyMib = 5,
  maxTotalMib = 17,
}: StorageUsageBarProps): JSX.Element {
  const maxTotalBytes = maxTotalMib * MIB;

  const totalBytes = entries.reduce((sum, e) => sum + JSON.stringify(e.value).length, 0);

  const isFull = totalBytes >= maxTotalBytes;
  const pct = Math.min((totalBytes / maxTotalBytes) * 100, 100);
  const barColor = isFull || pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-400" : "bg-green-500";

  return (
    <div className="px-3 py-2 border-t border-gray-100 bg-white shrink-0">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[10px] font-medium ${isFull ? "text-red-600" : "text-gray-500"}`}>
          {formatMib(totalBytes)} used &middot; {entries.length} key
          {entries.length !== 1 ? "s" : ""}
          {isFull ? " — STORAGE FULL" : ""}
        </span>
        <span className="text-[10px] text-gray-400">
          {maxPerKeyMib} MiB/key &middot; {maxTotalMib} MiB total
        </span>
      </div>
      <div
        className="h-1 rounded-full bg-gray-100 overflow-hidden"
        title={`${formatMib(totalBytes)} of ${maxTotalMib} MiB used`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
