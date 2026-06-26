import type { AlistigoListItem } from "@alistigo/document-format";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trash2 } from "lucide-react";
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import type { JSX } from "react";
import { EmptyState } from "../EmptyState/EmptyState.js";
import { Button } from "../ui/button.js";

export interface ListViewProps {
  items: AlistigoListItem[];
  onDelete: (elementId: string, position: number) => void;
}

interface ListItemProps {
  listItem: AlistigoListItem;
  onDelete: (elementId: string, position: number) => void;
}

function ListItem({ listItem, onDelete }: ListItemProps): JSX.Element {
  const { _ } = useLingui();
  const isPresent = useIsPresent();
  const elementId = listItem["alistigo:listElementId"];
  const text = listItem.name;
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      data-deleting={!isPresent ? "true" : undefined}
      className="flex items-center justify-between gap-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-fg)]"
    >
      <span className="flex-1 truncate">{text}</span>
      <Button
        variant="ghost"
        size="icon"
        aria-label={_(msg`Delete "${text}"`)}
        onClick={() => onDelete(elementId, listItem.position)}
      >
        <Trash2 aria-hidden="true" className="size-5" />
      </Button>
    </motion.li>
  );
}

export function ListView({ items, onDelete }: ListViewProps): JSX.Element {
  if (items.length === 0) {
    return <EmptyState />;
  }
  return (
    <ul className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {items.map((listItem) => (
          <ListItem
            key={listItem["alistigo:listElementId"]}
            listItem={listItem}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
}
