import {
  ArtifactContextMenuContainer,
  ArtifactInfoPanel,
  AsyncProgressBar,
  alistigoLogoUrl,
  Modal,
  type PluginInfo,
} from "@alistigo/artifact-core-components-react";
import type { AlistigoPlugin } from "@alistigo/artifact-plugin-api";
import { AlistigoApp, AlistigoProvider } from "@alistigo/list-components-react";
import type { AlistigoDocument, AlistigoListStore } from "@alistigo/list-document";
import { ListApplicationService } from "@alistigo/list-document";
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

/**
 * Wraps a ListApplicationService to lazily seed storage on the first write.
 * Storage is never touched at mount — only when the user performs their first edit.
 */
function createLazyInitService(
  service: ListApplicationService,
  repository: AlistigoListStore,
  seedDocument: AlistigoDocument,
): ListApplicationService {
  let seeded = false;

  async function ensureSeeded(): Promise<void> {
    if (seeded) return;
    const seedable = repository as { seedIfEmpty?(doc: AlistigoDocument): Promise<void> };
    await seedable.seedIfEmpty?.(seedDocument);
    seeded = true;
  }

  return new Proxy(service, {
    get(target, prop: string) {
      if (prop === "addListElement" || prop === "deleteListElement") {
        return async (...args: unknown[]) => {
          await ensureSeeded();
          const method = target[prop as keyof typeof target] as (...a: unknown[]) => unknown;
          return method.apply(target, args);
        };
      }
      const value = target[prop as keyof typeof target];
      return typeof value === "function" ? value.bind(target) : value;
    },
  }) as unknown as ListApplicationService;
}

interface AppProps {
  initialDocument: AlistigoDocument;
  repository: AlistigoListStore;
  plugins: AlistigoPlugin[];
  spec: Record<string, Record<string, unknown>>;
  isDraft: boolean;
}

// fallow-ignore-next-line complexity
function App({
  initialDocument,
  repository,
  plugins,
  spec,
  isDraft,
}: AppProps): JSX.Element | null {
  const service = useMemo(() => {
    const base = new ListApplicationService(repository);
    return createLazyInitService(base, repository, initialDocument);
  }, [repository, initialDocument]);

  const listId = useMemo(() => parseListId(initialDocument["@id"]), [initialDocument]);

  const [infoOpen, setInfoOpen] = useState(false);
  const [bootDoc, setBootDoc] = useState<AlistigoDocument | undefined>(undefined);

  const pluginsInfos = useMemo(() => buildPluginInfos(plugins, spec), [plugins, spec]);

  useEffect(() => {
    service
      .loadDocument(listId)
      .then((doc) => {
        log.info({ listId: listId.toString() }, "app mounted");
        setBootDoc(doc ?? initialDocument);
      })
      .catch((err: unknown) => {
        log.error({ err }, "failed to load document");
      });
  }, [service, listId, initialDocument]);

  if (!bootDoc) return null;

  const badgeRenderer = plugins.find((p) => p.renderStatusBadge)?.renderStatusBadge;
  const menuContentRenderer = plugins.find((p) => p.renderMenuContent)?.renderMenuContent;

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
        statusBadge={badgeRenderer}
      >
        {menuContentRenderer?.()}
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
          <ListBody isDraft={isDraft} plugins={plugins} repository={repository} />
        </AlistigoApp>
      </AlistigoProvider>
      <AsyncProgressBar />
    </>
  );
}

export default App;
