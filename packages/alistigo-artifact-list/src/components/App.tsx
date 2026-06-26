import {
  ClaudeArtifactListRepository,
  isClaudeArtifactContext,
} from "@alistigo/claude-artifact-list-storage";
import { ListApplicationService } from "@alistigo/document-editor";
import type { AlistigoDocument } from "@alistigo/document-format";
import { parseListId } from "@alistigo/domain";
import { AlistigoApp, AlistigoProvider } from "@alistigo/list-components-react";
import { LocalStorageListRepository } from "@alistigo/local-storage-repository";
import { createLogger } from "@alistigo/logger";
import { type JSX, useEffect, useMemo, useState } from "react";
import ListBody from "./ListBody.js";

const log = createLogger("alistigo:artifact-list");

interface AppProps {
  initialDocument: AlistigoDocument;
}

function App({ initialDocument }: AppProps): JSX.Element | null {
  const repository = useMemo(() => {
    const ctx = isClaudeArtifactContext() ? "claude-artifact" : "localStorage";
    log.info({ ctx }, "storage context detected");
    return ctx === "claude-artifact"
      ? new ClaudeArtifactListRepository()
      : new LocalStorageListRepository();
  }, []);
  const service = useMemo(() => new ListApplicationService(repository), [repository]);
  const listId = useMemo(() => parseListId(initialDocument["alistigo:listId"]), [initialDocument]);

  const [bootDoc, setBootDoc] = useState<AlistigoDocument | undefined>(undefined);

  useEffect(() => {
    const seed =
      repository instanceof LocalStorageListRepository
        ? repository.seedIfEmpty(initialDocument)
        : Promise.resolve();
    seed
      .then(() => service.loadDocument(listId))
      .then((doc) => {
        log.info({ listId: listId.toString() }, "app mounted");
        setBootDoc(doc ?? initialDocument);
      })
      .catch((err: unknown) => {
        log.error({ err }, "failed to load document");
      });
  }, [repository, initialDocument, service, listId]);

  if (!bootDoc) return null;

  return (
    <AlistigoProvider service={service} listId={listId} initialDocument={bootDoc}>
      <AlistigoApp>
        <ListBody />
      </AlistigoApp>
    </AlistigoProvider>
  );
}

export default App;
