import type { ArtifactApiDefinition } from "@alistigo/ai-chat-async-api";
import { ARTIFACT_REGISTRY } from "@alistigo/artifact-manager";
import type { JSX } from "react";
import { useCallback, useMemo } from "react";
import listApiDef from "../../../../packages/artifact-list/api.json";
import { buildArtifactConfig, buildIframeSrcdoc, SRCDOC_CSP } from "../buildIframeSrcdoc";
import { useClaudeStorageSimulator } from "../hooks/useClaudeStorageSimulator";
import { useDocumentFixtures, useDocumentFixturesMap } from "../hooks/useDocumentFixtures";
import { type Config, useHostConfig } from "../hooks/useHostConfig";
import { useIframeControls } from "../hooks/useIframeControls";
import { useLocalStorageEntries } from "../hooks/useLocalStorageEntries";
import { ArtifactViewPanel } from "./ArtifactViewPanel";
import HostForm from "./HostForm";

// In dev: Vite serves this file directly from the dev server.
// In production: Vite inlines it as a broken data-URI (bare specifiers can't be resolved
// from data: modules), so we skip it entirely and use the registry's cdnUrl instead.
const DEV_ENTRY_URL = import.meta.env.DEV
  ? new URL("../artifact-entry.tsx", import.meta.url).href
  : null;

// Dev only: point plugin loading at local source (served by Vite's /@fs/ file
// middleware) instead of jsDelivr, so the playground works without publishing or
// building any plugin package first. Unset in production builds.
const DEV_PLUGIN_URL_OVERRIDES: Record<string, string> | undefined = import.meta.env.DEV
  ? Object.fromEntries(
      Object.entries(__ALISTIGO_DEV_PLUGIN_SRC_PATHS__).map(([packageName, absPath]) => [
        packageName,
        `${window.location.origin}/@fs${absPath}`,
      ]),
    )
  : undefined;

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

function rawOrDefault(raw: string): string {
  return raw || DEFAULT_DOC_JSON;
}

function useDocJson(config: Config): string {
  const fixturesMap = useDocumentFixturesMap();
  return useMemo(() => {
    if (config.document === "") return DEFAULT_DOC_JSON;
    if (config.document === "__raw__") return rawOrDefault(config.rawDocument);
    const doc = fixturesMap.get(config.document);
    return doc !== undefined ? JSON.stringify(doc) : DEFAULT_DOC_JSON;
  }, [config.document, config.rawDocument, fixturesMap]);
}

function HostPage(): JSX.Element {
  const { config, setConfig } = useHostConfig();
  const { iframeRef, reloadKey, reload, clearData } = useIframeControls();
  const { clearStorage, storeEntries } = useClaudeStorageSimulator(
    iframeRef,
    config.aiContext === "claude",
  );
  const { entries: localStorageEntries, refresh: refreshLocalStorage } = useLocalStorageEntries();
  const documentNames = useDocumentFixtures();
  const docJson = useDocJson(config);

  const handleClearData = useCallback(async () => {
    clearStorage();
    await clearData();
    refreshLocalStorage();
  }, [clearStorage, clearData, refreshLocalStorage]);

  const iframeAllow =
    config.aiContext === "claude" ? "clipboard-write" : "fullscreen, clipboard-write";

  const configJson = useMemo(() => JSON.stringify(buildArtifactConfig(config), null, 2), [config]);

  const srcdoc = useMemo(() => {
    const scriptUrl = import.meta.env.DEV
      ? (DEV_ENTRY_URL ?? "")
      : (ARTIFACT_REGISTRY[config.app]?.cdnUrl ?? "");
    return buildIframeSrcdoc({
      config,
      docJson,
      scriptUrl,
      csp: SRCDOC_CSP,
      isDev: import.meta.env.DEV,
      devPluginUrlOverrides: DEV_PLUGIN_URL_OVERRIDES,
    });
  }, [config, docJson]);

  return (
    <div className="flex h-full w-full font-sans text-sm">
      <HostForm
        config={config}
        onConfigChange={setConfig}
        onReload={reload}
        onClearData={handleClearData}
        documentNames={documentNames}
        localStorageEntries={localStorageEntries}
        storageEntries={storeEntries}
      />
      <div className="w-1/2">
        <ArtifactViewPanel
          srcdoc={srcdoc}
          iframeRef={iframeRef}
          reloadKey={reloadKey}
          iframeAllow={iframeAllow}
          configJson={configJson}
          docJson={docJson}
          apiDefinition={listApiDef as ArtifactApiDefinition}
        />
      </div>
    </div>
  );
}

export default HostPage;
