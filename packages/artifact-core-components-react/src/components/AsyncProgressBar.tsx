import type { ReactNode } from "react";
import { useAsyncProgress } from "./AsyncProgressContext.js";

export function AsyncProgressBar(): ReactNode {
  const { pending } = useAsyncProgress();
  if (!pending) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-0.5 overflow-hidden bg-blue-100">
      <style>{`
        @keyframes alistigo-progress {
          0%   { left: -55%; width: 55%; }
          60%  { left: 100%; width: 55%; }
          100% { left: 100%; width: 0; }
        }
      `}</style>
      <div
        className="absolute top-0 h-full rounded-full bg-blue-500"
        style={{ animation: "alistigo-progress 1.4s ease-in-out infinite" }}
      />
    </div>
  );
}
