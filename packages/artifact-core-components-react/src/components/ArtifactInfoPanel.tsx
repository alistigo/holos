import type { ReactNode } from "react";
import { PluginList } from "./PluginList.js";
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
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-semibold text-gray-900 text-sm">{artifactName}</p>
        <p className="text-gray-400 text-xs">v{artifactVersion}</p>
      </div>
      <PluginList plugins={plugins} />
    </div>
  );
}
