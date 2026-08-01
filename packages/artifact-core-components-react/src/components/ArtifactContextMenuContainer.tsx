import { type ReactNode, useState } from "react";
import { Modal } from "./Modal.js";

export interface ArtifactContextMenuContainerProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}

export function ArtifactContextMenuContainer({
  icon,
  title,
  children,
}: ArtifactContextMenuContainerProps): ReactNode {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        data-testid="alistigo-badge"
        onClick={() => setOpen(true)}
        aria-label="Alistigo artifact info"
        className="absolute top-2 right-2 z-40 h-8 w-8 overflow-hidden rounded-full shadow-md ring-1 ring-gray-200 hover:ring-2 hover:ring-gray-400 focus:outline-none"
      >
        {icon}
      </button>
      {open && (
        <Modal title={title} onClose={() => setOpen(false)}>
          {children}
        </Modal>
      )}
    </>
  );
}
