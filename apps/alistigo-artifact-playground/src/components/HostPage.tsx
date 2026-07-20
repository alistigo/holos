import type { JSX } from "react";
import { useMemo } from "react";
import { buildIframeSrcdoc, SRCDOC_CSP } from "../buildIframeSrcdoc";
import { useDocumentFixtures, useDocumentFixturesMap } from "../hooks/useDocumentFixtures";
import { type Config, useHostConfig } from "../hooks/useHostConfig";
import { useIframeControls } from "../hooks/useIframeControls";
import { ArtifactViewPanel } from "./ArtifactViewPanel";
import HostForm from "./HostForm";

// Vite resolves this to the dev server URL in dev, or the compiled chunk URL in production.
const ARTIFACT_ENTRY_URL = new URL("../artifact-entry.tsx", import.meta.url).href;

const DEFAULT_DOC_JSON = JSON.stringify({
  "@context": { "@vocab": "https://schema.org/", alistigo: "https://alistigo.ai/vocab/" },
  "@type": "ItemList",
  "alistigo:listId": "lst_00000000000000000000000000",
  "alistigo:schemaVersion": "1.0.0",
  itemListElement: [],
  "alistigo:listEventLog": [
    {
      "alistigo:listEventId": "lev_00000000000000000000000001",
      "alistigo:eventType": "ListCreated",
      "alistigo:listId": "lst_00000000000000000000000000",
      "alistigo:actorId": "act_00000000000000000000000000",
      "alistigo:timestamp": "2026-01-01T00:00:00.000Z",
    },
  ],
});

function useDocJson(config: Config): string {
  const fixturesMap = useDocumentFixturesMap();
  return useMemo(() => {
    if (config.document === "") return DEFAULT_DOC_JSON;
    const doc = fixturesMap.get(config.document);
    return doc !== undefined ? JSON.stringify(doc) : DEFAULT_DOC_JSON;
  }, [config.document, fixturesMap]);
}

function HostPage(): JSX.Element {
  const { config, setConfig } = useHostConfig();
  const { iframeRef, reloadKey, reload, clearData } = useIframeControls();
  const documentNames = useDocumentFixtures();
  const docJson = useDocJson(config);

  const iframeAllow =
    config.aiContext === "claude" ? "clipboard-write" : "fullscreen, clipboard-write";

  const srcdoc = useMemo(
    () =>
      buildIframeSrcdoc({
        config,
        docJson,
        scriptUrl: ARTIFACT_ENTRY_URL,
        csp: SRCDOC_CSP,
      }),
    [config, docJson],
  );

  return (
    <div className="flex h-full w-full font-sans text-sm">
      <HostForm
        config={config}
        onConfigChange={setConfig}
        onReload={reload}
        onClearData={clearData}
        documentNames={documentNames}
      />
      <div className="w-1/2">
        <ArtifactViewPanel
          srcdoc={srcdoc}
          iframeRef={iframeRef}
          reloadKey={reloadKey}
          iframeAllow={iframeAllow}
        />
      </div>
    </div>
  );
}

export default HostPage;
