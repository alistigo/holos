import type { ReactNode } from "react";
import { ArtifactInfoPanel } from "./ArtifactInfoPanel.js";
import { Modal } from "./Modal.js";
import type { PluginInfo } from "./types.js";

export interface ArtifactInfoModalProps {
  artifactName: string;
  artifactVersion: string;
  plugins: PluginInfo[];
  onClose: () => void;
}

export function ArtifactInfoModal({
  artifactName,
  artifactVersion,
  plugins,
  onClose,
}: ArtifactInfoModalProps): ReactNode {
  return (
    <Modal title={artifactName} onClose={onClose}>
      <ArtifactInfoPanel
        artifactName={artifactName}
        artifactVersion={artifactVersion}
        plugins={plugins}
      />
    </Modal>
  );
}
