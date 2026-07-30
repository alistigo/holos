import type { ReactNode } from "react";
import type { PluginInfo } from "./types.js";

export interface ArtifactInfoPanelProps {
  artifactName: string;
  artifactVersion: string;
  plugins: PluginInfo[];
}

export function ArtifactInfoPanel({
  artifactName,
  artifactVersion,
  plugins,
}: ArtifactInfoPanelProps): ReactNode {
  return (
    <div>
      <div className="border-b border-gray-100 pb-4">
        <p className="font-semibold text-gray-900 text-sm">{artifactName}</p>
        <p className="text-gray-400 text-xs">v{artifactVersion}</p>
      </div>
      <div className="pt-4">
        {plugins.length === 0 ? (
          <p className="text-center text-gray-400 text-xs">No plugins loaded</p>
        ) : (
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
                  {plugin.error != null && (
                    <p className="mt-0.5 text-red-500 text-xs">{plugin.error}</p>
                  )}
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
        )}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: PluginInfo["status"] }): ReactNode {
  const colors: Record<PluginInfo["status"], string> = {
    loaded: "bg-green-500",
    error: "bg-red-500",
    "not-loaded": "bg-gray-300",
  };
  return <span className={`h-2 w-2 rounded-full ${colors[status]}`} />;
}
