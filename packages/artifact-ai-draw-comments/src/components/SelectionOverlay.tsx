import { Trans, useLingui } from "@lingui/react/macro";
import { useEffect, useRef, useState } from "react";
import type { SelectionRegion } from "../domain/session.js";

interface SelectionOverlayProps {
  onSelect: (region: SelectionRegion) => void;
  onCancel: () => void;
}

interface DragPoint {
  x: number;
  y: number;
}

function computeRegion(start: DragPoint, end: DragPoint): SelectionRegion {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

function isTooSmall(region: SelectionRegion | null): boolean {
  if (region === null) return false;
  return region.width < 20 || region.height < 20;
}

export function SelectionOverlay({ onSelect, onCancel }: SelectionOverlayProps) {
  const { t } = useLingui();
  const startRef = useRef<DragPoint | null>(null);
  const [preview, setPreview] = useState<SelectionRegion | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function handleMouseDown(e: React.MouseEvent) {
    startRef.current = { x: e.clientX, y: e.clientY };
    setPreview({ x: e.clientX, y: e.clientY, width: 0, height: 0 });
  }

  function handleMouseMove(e: React.MouseEvent) {
    const start = startRef.current;
    if (start === null) return;
    setPreview(computeRegion(start, { x: e.clientX, y: e.clientY }));
  }

  function handleMouseUp() {
    if (preview === null || isTooSmall(preview)) {
      startRef.current = null;
      setPreview(null);
      return;
    }
    onSelect(preview);
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: custom drag-select overlay; interaction is handled by mouse events
    <div
      className="fixed inset-0 cursor-crosshair select-none bg-black/5"
      style={{ zIndex: "var(--ai-draw-overlay-z)" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      role="presentation"
      aria-label={t`Drag to select annotation area`}
    >
      <button
        type="button"
        onClick={onCancel}
        aria-label={t`Cancel selection`}
        className="absolute right-3 top-3 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
        style={{ zIndex: "var(--ai-draw-overlay-z)" }}
      >
        ×
      </button>
      {preview !== null && (
        <div
          className="pointer-events-none absolute border-2 border-blue-500 bg-blue-100/20"
          style={{
            left: preview.x,
            top: preview.y,
            width: preview.width,
            height: preview.height,
          }}
        />
      )}
      {isTooSmall(preview) && (
        <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded bg-black/70 px-3 py-1 text-xs text-white">
          <Trans>Select a larger area (minimum 20×20 px)</Trans>
        </div>
      )}
      <div className="absolute left-1/2 top-2 -translate-x-1/2 rounded bg-black/60 px-3 py-1 text-xs text-white">
        <Trans>Drag to select area — Esc to cancel</Trans>
      </div>
    </div>
  );
}
