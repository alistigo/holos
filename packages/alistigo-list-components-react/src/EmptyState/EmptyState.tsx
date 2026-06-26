import { Trans } from "@lingui/react/macro";
import { ListChecks } from "lucide-react";
import type { JSX, ReactNode } from "react";

export interface EmptyStateProps {
  /**
   * Override the default empty-state message. Pass any ReactNode — usually
   * a `<Trans>` element from the host app, or plain text. When omitted,
   * the components-package default ("No elements yet.") is used and gets
   * translated via this package's catalog.
   */
  message?: ReactNode;
}

export function EmptyState({ message }: EmptyStateProps): JSX.Element {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center gap-2 rounded-[var(--radius)] border border-dashed border-[var(--color-border)] px-4 py-12 text-center text-[var(--color-fg-muted)]"
    >
      <ListChecks aria-hidden="true" className="size-10" />
      <p className="text-sm">{message ?? <Trans>No elements yet.</Trans>}</p>
    </div>
  );
}
