import {
  ArtifactContextMenuContainer,
  ArtifactInfoPanel,
  alistigoLogoUrl,
  Modal,
  type PluginInfo,
} from "@alistigo/artifact-core-components-react";
import type { AlistigoPlugin } from "@alistigo/artifact-plugin-api";
import { AlistigoApp, AlistigoProvider } from "@alistigo/list-components-react";
import type { AlistigoListStore } from "@alistigo/list-document-editor";
import { ListApplicationService } from "@alistigo/list-document-editor";
import type { AlistigoDocument } from "@alistigo/list-document-format";
import { parseListId } from "@alistigo/list-domain";
import { createLogger } from "@alistigo/logger";
import { type JSX, useEffect, useMemo, useState } from "react";
import pkg from "../../package.json" with { type: "json" };
import ListBody from "./ListBody.js";

const log = createLogger("alistigo:artifact-list");

function buildPluginInfos(
  plugins: AlistigoPlugin[],
  spec: Record<string, Record<string, unknown>>,
): PluginInfo[] {
  return Object.keys(spec).map((pkgName) => {
    const plugin = plugins.find((p) => p.name === pkgName);
    if (plugin !== undefined) {
      return {
        name: plugin.name,
        version: plugin.version ?? "?",
        type: plugin.type ?? "unknown",
        status: "active" as const,
      };
    }
    return {
      name: pkgName,
      version: "?",
      type: "unknown",
      status: "error" as const,
      error: "Failed to load",
    };
  });
}

interface AppProps {
  initialDocument: AlistigoDocument;
  repository: AlistigoListStore;
  plugins: AlistigoPlugin[];
  spec: Record<string, Record<string, unknown>>;
}

function App({ initialDocument, repository, plugins, spec }: AppProps): JSX.Element | null {
  const service = useMemo(() => new ListApplicationService(repository), [repository]);
  const listId = useMemo(() => parseListId(initialDocument["alistigo:listId"]), [initialDocument]);

  const [infoOpen, setInfoOpen] = useState(false);
  const [bootDoc, setBootDoc] = useState<AlistigoDocument | undefined>(undefined);

  const pluginsInfos = useMemo(() => buildPluginInfos(plugins, spec), [plugins, spec]);
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
    <>
      {infoOpen && (
        <Modal title="@alistigo/artifact-list" onClose={() => setInfoOpen(false)}>
          <ArtifactInfoPanel
            artifactName="@alistigo/artifact-list"
            artifactVersion={pkg.version}
            plugins={pluginsInfos}
          />
        </Modal>
      )}
      <ArtifactContextMenuContainer
        icon={<img src={alistigoLogoUrl} alt="" className="h-full w-full object-cover" />}
      >
        <button
          type="button"
          onClick={() => setInfoOpen(true)}
          aria-label="Open artifact info"
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 focus:outline-none"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5 text-gray-600"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="8.01" strokeLinecap="round" strokeWidth="2.5" />
            <line x1="12" y1="12" x2="12" y2="16" strokeLinecap="round" />
          </svg>
        </button>
      </ArtifactContextMenuContainer>
      <AlistigoProvider service={service} listId={listId} initialDocument={bootDoc}>
        <AlistigoApp>
          <ListBody />
        </AlistigoApp>
      </AlistigoProvider>
    </>
  );
}

export default App;
