import { type ReactNode, useEffect, useState } from "react";

export interface ArtifactContextMenuContainerProps {
  icon: ReactNode;
  children: ReactNode;
  /** Optional badge renderer — receives the toggle handler and renders to the left of the icon button. */
  statusBadge?: ((onToggle: () => void) => ReactNode) | undefined;
}

// fallow-ignore-next-line complexity
export function ArtifactContextMenuContainer({
  icon,
  children,
  statusBadge,
}: ArtifactContextMenuContainerProps): ReactNode {
  const [open, setOpen] = useState(false);

  const handleToggle = (): void => {
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Close artifact info"
        tabIndex={-1}
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-30 bg-black/20 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-end pr-4">
        <div
          className="pointer-events-auto relative w-72 transition-transform duration-300 ease-out"
          style={{ transform: open ? "translateY(0)" : "translateY(-100%)" }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Alistigo artifact info"
            aria-hidden={!open}
            inert={!open}
            className={`relative z-10 rounded-bl-xl border border-gray-200 bg-white p-4 transition-shadow duration-300 ${
              open ? "shadow-xl" : ""
            }`}
          >
            {children}
          </div>
          <div className="-mt-px absolute top-full right-0 z-20 flex items-start gap-1">
            {statusBadge?.(handleToggle)}
            <button
              type="button"
              data-testid="alistigo-badge"
              onClick={handleToggle}
              aria-label="Alistigo artifact info"
              aria-expanded={open}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-b-lg border-x border-t border-b border-t-white border-gray-200 bg-white shadow-md hover:border-gray-400 focus:outline-none"
            >
              {icon}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
