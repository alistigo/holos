import { createCheckListElementEvent } from "@alistigo/artifact-list-checkbox-plugin";
import type { AlistigoPlugin } from "@alistigo/artifact-plugin-api";
import {
  AddElementInput,
  getSessionActorId,
  ListView,
  useAlistigoActions,
  useAlistigoDocument,
  useSetAlistigoDocument,
} from "@alistigo/list-components-react";
import type { AlistigoDocument, AlistigoListStore } from "@alistigo/list-document";
import { buildProjection } from "@alistigo/list-document";
import { createLogger } from "@alistigo/logger";
import { Trans } from "@lingui/react/macro";
import { type JSX, useCallback, useMemo } from "react";

const log = createLogger("alistigo:artifact-list:list-body");

interface ListBodyProps {
  isDraft: boolean;
  plugins: AlistigoPlugin[];
  repository: AlistigoListStore;
}

function DraftBanner(): JSX.Element {
  return (
    <output className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
      <span>
        <Trans>Preview — publish this artifact to start editing.</Trans>
      </span>
    </output>
  );
}

// fallow-ignore-next-line complexity
function ListBody({ isDraft, plugins, repository }: ListBodyProps): JSX.Element {
  const document = useAlistigoDocument();
  const actions = useAlistigoActions();
  const setDoc = useSetAlistigoDocument();

  const projection = useMemo(() => buildProjection(document), [document]);

  // Only pass plugins that contribute list-element leading UI to ListView.
  const domainPlugins = useMemo(
    () => plugins.filter((p) => p.renderListElementLeading !== undefined),
    [plugins],
  );

  // Build the alistigo:plugins section from all loaded plugins.
  const pluginRecords = useMemo(
    () =>
      plugins.map((p) => ({
        "@id": p.name,
        name: p.name,
        ...(p.version !== undefined ? { version: p.version } : {}),
      })),
    [plugins],
  );

  const handlePluginCommand = useCallback(
    (pluginName: string, commandName: string, payload: unknown): void => {
      if (
        pluginName === "@alistigo/artifact-list-checkbox-plugin" &&
        commandName === "checkListElement"
      ) {
        const { elementId, checked } = payload as { elementId: string; checked: boolean };
        const eventRecord = createCheckListElementEvent(
          elementId,
          getSessionActorId(),
          document["@id"],
          checked,
        );
        const updatedDoc: AlistigoDocument = {
          ...document,
          "alistigo:eventLog": [...document["alistigo:eventLog"], eventRecord],
          "alistigo:plugins": pluginRecords,
          itemListElement: document.itemListElement.map((item) =>
            item["alistigo:listElementId"] === elementId
              ? {
                  ...item,
                  "alistigo:metadatas": {
                    ...item["alistigo:metadatas"],
                    checkbox: { selected: checked },
                  },
                }
              : item,
          ),
        };
        setDoc(updatedDoc);
        repository.saveDocument(updatedDoc).catch((err: unknown) => {
          log.error({ err }, "failed to persist checkbox event");
        });
      }
    },
    [document, pluginRecords, setDoc, repository],
  );

  return (
    <>
      {isDraft && <DraftBanner />}
      <h1 className="text-xl font-semibold tracking-tight">
        {document.name ?? <Trans>Untitled</Trans>}
      </h1>
      {!isDraft && <AddElementInput onAdd={actions.addElement} />}
      {isDraft ? (
        <ListView
          projection={projection}
          {...(document["alistigo:agents"] !== undefined
            ? { actors: document["alistigo:agents"] }
            : {})}
          plugins={domainPlugins}
          events={document["alistigo:eventLog"]}
          onPluginCommand={handlePluginCommand}
        />
      ) : (
        <ListView
          projection={projection}
          {...(document["alistigo:agents"] !== undefined
            ? { actors: document["alistigo:agents"] }
            : {})}
          plugins={domainPlugins}
          events={document["alistigo:eventLog"]}
          onPluginCommand={handlePluginCommand}
          onDelete={(elementId, _position) => actions.deleteElement(elementId)}
        />
      )}
    </>
  );
}

export default ListBody;
