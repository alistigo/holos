import type { AlistigoPlugin } from "@alistigo/artifact-plugin-api";
import type {
  AlistigoAgentRecord,
  AlistigoEventRecord,
  AlistigoItemAttribution,
  AlistigoProjection,
} from "@alistigo/list";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import type { JSX, ReactNode } from "react";
import { EmptyState } from "../EmptyState/EmptyState.js";
import { Button } from "../ui/button.js";

export interface ListViewProps {
  projection: AlistigoProjection;
  /** When omitted the delete button is hidden — use for read-only contexts. */
  onDelete?: (elementId: string, position: number) => void;
  actors?: AlistigoAgentRecord[];
  plugins?: AlistigoPlugin[];
  events?: AlistigoEventRecord[];
  onPluginCommand?: (pluginName: string, commandName: string, payload: unknown) => void;
}

function AttributionRow({ attribution }: { attribution: AlistigoItemAttribution }): JSX.Element {
  const relative = formatDistanceToNow(new Date(attribution.addedAt), {
    addSuffix: true,
  });
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
      <img src={attribution.avatar} alt={attribution.pseudo} className="w-4 h-4 rounded-full" />
      <span>{attribution.pseudo}</span>
      <span>·</span>
      <span>{relative}</span>
    </div>
  );
}

function buildElementMetadata(
  elementId: string,
  events: AlistigoEventRecord[],
  plugin: AlistigoPlugin,
): Record<string, unknown> {
  let meta: Record<string, unknown> = {};
  for (const event of events) {
    meta = plugin.reduce?.(elementId, meta, event) ?? meta;
  }
  return meta;
}

interface ListItemProps {
  elementId: string;
  position: number;
  text: string;
  attribution: AlistigoItemAttribution | undefined;
  showAttribution: boolean;
  plugins: AlistigoPlugin[] | undefined;
  events: AlistigoEventRecord[] | undefined;
  onDelete: ((elementId: string, position: number) => void) | undefined;
  onPluginCommand:
    | ((pluginName: string, commandName: string, payload: unknown) => void)
    | undefined;
}

// fallow-ignore-next-line complexity
function ListItem({
  elementId,
  position,
  text,
  attribution,
  showAttribution,
  plugins,
  events,
  onDelete,
  onPluginCommand,
}: ListItemProps): JSX.Element {
  const { _ } = useLingui();
  const isPresent = useIsPresent();

  const leadingNodes: ReactNode[] =
    plugins?.map((plugin) =>
      plugin.renderListElementLeading?.(
        elementId,
        buildElementMetadata(elementId, events ?? [], plugin),
        (commandName: string, payload: unknown) =>
          onPluginCommand?.(plugin.name, commandName, payload),
      ),
    ) ?? [];

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      data-deleting={!isPresent ? "true" : undefined}
      className="flex flex-col rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-fg)]"
    >
      <div className="flex items-center justify-between gap-2">
        {leadingNodes.length > 0 && (
          <div className="flex items-center gap-1">
            {leadingNodes.map((node, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static plugin list, index is stable
              <span key={i}>{node}</span>
            ))}
          </div>
        )}
        <span className="flex-1 truncate">{text}</span>
        {onDelete !== undefined && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={_(msg`Delete "${text}"`)}
            onClick={() => onDelete(elementId, position)}
          >
            <Trash2 aria-hidden="true" className="size-5" />
          </Button>
        )}
      </div>
      {showAttribution && attribution !== undefined && <AttributionRow attribution={attribution} />}
    </motion.li>
  );
}

export function ListView({
  projection,
  onDelete,
  actors,
  plugins,
  events,
  onPluginCommand,
}: ListViewProps): JSX.Element {
  const showAttribution = (actors?.length ?? 0) >= 2;

  if (projection.itemListElement.length === 0) {
    return <EmptyState />;
  }
  return (
    <ul className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {projection.itemListElement.map((projectionItem) => {
          const elementId = projectionItem.item["@id"];
          return (
            <ListItem
              key={elementId}
              elementId={elementId}
              position={projectionItem.position}
              text={projectionItem.item.name}
              attribution={projectionItem["alistigo:attribution"]}
              showAttribution={showAttribution}
              plugins={plugins}
              events={events}
              onDelete={onDelete}
              onPluginCommand={onPluginCommand}
            />
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
