import { ARTIFACT_REGISTRY } from "@alistigo/artifact-manager";
import type { JSX } from "react";
import { useCallback, useMemo, useState } from "react";
import { buildArtifactConfig, buildIframeSrcdoc, SRCDOC_CSP } from "../buildIframeSrcdoc";
import { useClaudeCompleteSimulator } from "../hooks/useClaudeCompleteSimulator";
import { useClaudeStorageSimulator } from "../hooks/useClaudeStorageSimulator";
import { useDocumentFixtures, useMarkdownFixturesMap } from "../hooks/useDocumentFixtures";
import { useDownloadSimulator } from "../hooks/useDownloadSimulator";
import { type Config, useHostConfig } from "../hooks/useHostConfig";
import { useIframeControls } from "../hooks/useIframeControls";
import { useLocalStorageEntries } from "../hooks/useLocalStorageEntries";
import { useNavigationSimulator } from "../hooks/useNavigationSimulator";
import { useProxyFetchSimulator } from "../hooks/useProxyFetchSimulator";
import { ArtifactViewPanel } from "./ArtifactViewPanel";
import type { ClaudeSimulatorProps } from "./ClaudeSimulator";
import HostForm from "./HostForm";

// In dev: Vite serves this file directly from the dev server.
// In production: Vite inlines it as a broken data-URI (bare specifiers can't be resolved
// from data: modules), so we skip it entirely and use the registry's cdnUrl instead.
const DEV_ENTRY_URL: string = import.meta.env.DEV
  ? new URL("../artifact-entry.tsx", import.meta.url).href
  : "";

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

function resolveScriptUrl(isDev: boolean, app: string): string {
  return isDev ? DEV_ENTRY_URL : (ARTIFACT_REGISTRY[app]?.cdnUrl ?? "");
}

function useMarkdown(config: Config): string | undefined {
  const fixturesMap = useMarkdownFixturesMap();
  return useMemo(() => {
    if (config.document === "") return undefined;
    if (config.document === "__raw__") return config.rawMarkdown || undefined;
    return fixturesMap.get(config.document);
  }, [config.document, config.rawMarkdown, fixturesMap]);
}

// fallow-ignore-next-line complexity
function HostPage(): JSX.Element {
  const { config, setConfig } = useHostConfig();
  const { iframeRef, reloadKey, reload, clearData } = useIframeControls();
  const [simulatorDelayMs, setSimulatorDelayMs] = useState(0);
  const [suppressResponses, setSuppressResponses] = useState(false);

  const isClaudeContext = config.aiContext === "claude";

  const { clearStorage, storeEntries, sharedEntries, deleteEntry, setEntry } =
    useClaudeStorageSimulator(iframeRef, isClaudeContext, simulatorDelayMs, suppressResponses);

  const aiSimulator = useClaudeCompleteSimulator(iframeRef, isClaudeContext, simulatorDelayMs);
  const fetchSimulator = useProxyFetchSimulator(iframeRef, isClaudeContext, simulatorDelayMs);
  const downloadSimulator = useDownloadSimulator(iframeRef, isClaudeContext);
  const navSimulator = useNavigationSimulator(iframeRef, isClaudeContext);

  const { entries: localStorageEntries, refresh: refreshLocalStorage } = useLocalStorageEntries();
  const documentNames = useDocumentFixtures();
  const markdown = useMarkdown(config);

  const handleClearData = useCallback(async () => {
    clearStorage();
    await clearData();
    refreshLocalStorage();
  }, [clearStorage, clearData, refreshLocalStorage]);

  const iframeAllow =
    config.aiContext === "claude" ? "clipboard-write" : "fullscreen, clipboard-write";

  const configJson = useMemo(() => JSON.stringify(buildArtifactConfig(config), null, 2), [config]);

  const srcdoc = useMemo(
    () =>
      buildIframeSrcdoc({
        config,
        ...(markdown !== undefined ? { aiInputMarkdown: markdown } : {}),
        scriptUrl: resolveScriptUrl(import.meta.env.DEV, config.app),
        csp: SRCDOC_CSP,
        isDev: import.meta.env.DEV,
        devPluginUrlOverrides: DEV_PLUGIN_URL_OVERRIDES,
      }),
    [config, markdown],
  );

  const simulator: ClaudeSimulatorProps = {
    aiContext: config.aiContext,
    simulatorDelayMs,
    onSimulatorDelayChange: setSimulatorDelayMs,
    suppressResponses,
    onSuppressResponsesChange: setSuppressResponses,
    localEntries: localStorageEntries,
    privateEntries: storeEntries,
    sharedEntries,
    onDeleteEntry: deleteEntry,
    onSetEntry: setEntry,
    onClearSimulatorStorage: clearStorage,
    aiLogs: aiSimulator.logs,
    onClearAiLogs: aiSimulator.clearLogs,
    cannedResponse: aiSimulator.cannedResponse,
    onCannedResponseChange: aiSimulator.setCannedResponse,
    errorMode: aiSimulator.errorMode,
    onErrorModeChange: aiSimulator.setErrorMode,
    fetchLogs: fetchSimulator.logs,
    onClearFetchLogs: fetchSimulator.clearLogs,
    downloadLogs: downloadSimulator.logs,
    onClearDownloadLogs: downloadSimulator.clearLogs,
    navLogs: navSimulator.logs,
    onClearNavLogs: navSimulator.clearLogs,
    autoOpen: navSimulator.autoOpen,
    onAutoOpenChange: navSimulator.setAutoOpen,
    published: config.published,
    onPublishedChange: (published) => setConfig((c) => ({ ...c, published })),
    onClearData: handleClearData,
  };

  return (
    <div className="flex h-full w-full font-sans text-sm">
      <HostForm
        config={config}
        onConfigChange={setConfig}
        onReload={reload}
        documentNames={documentNames}
        simulator={simulator}
      />
      <div className="w-1/2">
        <ArtifactViewPanel
          srcdoc={srcdoc}
          iframeRef={iframeRef}
          reloadKey={reloadKey}
          iframeAllow={iframeAllow}
          configJson={configJson}
          aiInput={markdown}
        />
      </div>
    </div>
  );
}

export default HostPage;
