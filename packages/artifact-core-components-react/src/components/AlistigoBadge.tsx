import { type ReactNode, useEffect, useState } from "react";
import logoUrl from "../assets/logo.png";

export interface AlistigoBadgeProps {
  children: ReactNode;
}

export function AlistigoBadge({ children }: AlistigoBadgeProps): ReactNode {
  const [open, setOpen] = useState(false);

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
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-end">
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
            className="rounded-bl-xl relative z-15 bg-white p-4 ring-gray-200"
          >
            {children}
          </div>
          <button
            type="button"
            data-testid="alistigo-badge"
            onClick={() => setOpen((v) => !v)}
            aria-label="Alistigo artifact info"
            aria-expanded={open}
            className="absolute cursor-pointer right-0 top-full z-10 flex h-8 w-8 items-center justify-center rounded-b-lg bg-white shadow-md ring-1 ring-gray-200 hover:ring-2 hover:ring-gray-400 focus:outline-none"
          >
            <img src={logoUrl} alt="" className="h-5 w-5 object-contain" />
          </button>
        </div>
      </div>
    </>
  );
}
