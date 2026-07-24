import type { AlistigoListStore } from "@alistigo/document-editor";
import { ListApplicationService } from "@alistigo/document-editor";
import type { AlistigoDocument } from "@alistigo/document-format";
import { parseListId } from "@alistigo/domain";
import { AlistigoApp, AlistigoProvider } from "@alistigo/list-components-react";
import { createLogger } from "@alistigo/logger";
import { type JSX, useEffect, useMemo, useState } from "react";
import ListBody from "./ListBody.js";

const log = createLogger("alistigo:artifact-list");

interface AppProps {
  initialDocument: AlistigoDocument;
  repository: AlistigoListStore;
}

function App({ initialDocument, repository }: AppProps): JSX.Element | null {
  const service = useMemo(() => new ListApplicationService(repository), [repository]);
  const listId = useMemo(() => parseListId(initialDocument["alistigo:listId"]), [initialDocument]);

  const [bootDoc, setBootDoc] = useState<AlistigoDocument | undefined>(undefined);

  useEffect(() => {
    // Duck-typed: only storage plugins that implement seedIfEmpty (local-storage) will run it.
    const seedable = repository as { seedIfEmpty?(doc: AlistigoDocument): Promise<void> };
    const seed = seedable.seedIfEmpty?.(initialDocument) ?? Promise.resolve();
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
