import { type ReactNode, useState } from "react";
import logoUrl from "../assets/logo.png";
import { ArtifactInfoModal } from "./ArtifactInfoModal.js";
import type { PluginInfo } from "./types.js";

export interface AlistigoBadgeProps {
  artifactName: string;
  artifactVersion: string;
  plugins: PluginInfo[];
}

export function AlistigoBadge({
  artifactName,
  artifactVersion,
  plugins,
}: AlistigoBadgeProps): ReactNode {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute top-2 right-2 z-40 h-8 w-8 overflow-hidden rounded-full shadow-md ring-1 ring-gray-200 hover:ring-2 hover:ring-gray-400 focus:outline-none"
        aria-label="Alistigo artifact info"
      >
        <img src={logoUrl} alt="" className="h-full w-full object-cover" />
      </button>
      {open && (
        <ArtifactInfoModal
          artifactName={artifactName}
          artifactVersion={artifactVersion}
          plugins={plugins}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
