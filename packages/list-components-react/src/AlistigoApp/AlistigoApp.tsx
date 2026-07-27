import type { JSX, ReactNode } from "react";
import { useActionPending } from "../context/AlistigoProvider.js";
import { cn } from "../lib/cn.js";

export interface AlistigoAppProps {
  children: ReactNode;
  className?: string;
}

export function AlistigoApp({ children, className }: AlistigoAppProps): JSX.Element {
  const isPending = useActionPending();
  return (
    <div
      data-testid="alistigo-app"
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 bg-[var(--color-bg)] px-4 py-6 text-[var(--color-fg)]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        data-testid="action-pending"
        data-state={isPending ? "pending" : "idle"}
        className="sr-only"
      />
      {children}
    </div>
  );
}
