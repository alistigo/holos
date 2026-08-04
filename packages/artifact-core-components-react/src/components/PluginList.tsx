import type { ReactNode } from "react";
import type { PluginInfo } from "./types.js";

export interface PluginListProps {
  plugins: PluginInfo[];
}

export function PluginList({ plugins }: PluginListProps): ReactNode {
  if (plugins.length === 0) {
    return <p className="text-center text-gray-400 text-xs">No plugins loaded</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {plugins.map((plugin) => (
        <li
          key={plugin.name}
          data-plugin-name={plugin.name}
          data-plugin-status={plugin.status}
          className="flex items-start justify-between gap-2"
        >
          <div className="min-w-0">
            <p className="truncate text-gray-800 text-xs font-medium">{plugin.name}</p>
            <p className="text-gray-400 text-xs">v{plugin.version}</p>
            {plugin.error != null && <p className="mt-0.5 text-red-500 text-xs">{plugin.error}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-500 text-xs">
              {plugin.type}
            </span>
            <StatusDot status={plugin.status} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function StatusDot({ status }: { status: PluginInfo["status"] }): ReactNode {
  const colors: Record<PluginInfo["status"], string> = {
    active: "bg-green-500",
    loading: "bg-amber-400",
    inactive: "bg-gray-300",
    error: "bg-red-500",
  };
  return <span className={`h-2 w-2 rounded-full ${colors[status]}`} />;
}
