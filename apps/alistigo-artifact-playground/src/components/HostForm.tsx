import type { Dispatch, JSX, SetStateAction } from "react";
import { useState } from "react";
import { AI_CONTEXTS, KNOWN_APPS } from "../constants";
import type { Config } from "../hooks/useHostConfig";
import { ConfigFormArtifact } from "./ConfigFormArtifact";
import { ConfigFormListArtifact } from "./ConfigFormListArtifact";
import { StorageExplorer } from "./StorageExplorer";

type LeftTab = "config" | "storage" | "api";

interface HostFormProps {
  config: Config;
  onConfigChange: Dispatch<SetStateAction<Config>>;
  onReload: () => void;
  onClearData: () => void;
  documentNames: string[];
  storageEntries: [string, string][];
}

function SectionHeader({ label }: { label: string }): JSX.Element {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 border-t border-gray-200" />
    </div>
  );
}

function ConfigTab({
  config,
  onConfigChange,
  onReload,
  onClearData,
  documentNames,
}: Omit<HostFormProps, "storageEntries">): JSX.Element {
  const showArtifactConfig =
    config.app === "@alistigo/artifact-list" || Object.keys(config.plugins).length > 0;

  return (
    <div className="flex flex-col gap-4 p-3 overflow-y-auto flex-1">
      {/* Playground config */}
      <section>
        <SectionHeader label="Playground config" />
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1">
            <span className="font-medium text-gray-600 text-xs">AI Context</span>
            <select
              className="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
              value={config.aiContext}
              onChange={(e) => onConfigChange((c) => ({ ...c, aiContext: e.target.value }))}
            >
              {AI_CONTEXTS.map((ctx) => (
                <option key={ctx} value={ctx}>
                  {ctx}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-1.5 border border-gray-300 rounded bg-white cursor-pointer text-xs hover:bg-gray-100"
              onClick={onReload}
            >
              Reload
            </button>
            <button
              type="button"
              className="px-3 py-1.5 border border-gray-300 rounded bg-white cursor-pointer text-xs hover:bg-gray-100"
              onClick={onClearData}
            >
              Clear data
            </button>
          </div>
        </div>
      </section>

      {/* Global artifact config */}
      <section>
        <SectionHeader label="Global artifact config" />
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1">
            <span className="font-medium text-gray-600 text-xs">Artifact</span>
            <select
              className="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
              value={config.app}
              onChange={(e) => onConfigChange((c) => ({ ...c, app: e.target.value, document: "" }))}
            >
              {KNOWN_APPS.map((app) => (
                <option key={app} value={app}>
                  {app}
                </option>
              ))}
            </select>
          </label>

          <ConfigFormArtifact
            lang={config.lang}
            readonly={config.readonly}
            onLangChange={(lang) => onConfigChange((c) => ({ ...c, lang }))}
            onReadonlyChange={(readonly) => onConfigChange((c) => ({ ...c, readonly }))}
          />
        </div>
      </section>

      {/* Artifact config */}
      {showArtifactConfig && (
        <section>
          <SectionHeader label="Artifact config" />
          <ConfigFormListArtifact
            app={config.app}
            plugins={config.plugins}
            document={config.document}
            rawDocument={config.rawDocument}
            documentNames={documentNames}
            onPluginsChange={(plugins) => onConfigChange((c) => ({ ...c, plugins }))}
            onDocumentChange={(document, rawDocument) =>
              onConfigChange((c) => ({ ...c, document, rawDocument }))
            }
          />
        </section>
      )}
    </div>
  );
}

function HostForm({
  config,
  onConfigChange,
  onReload,
  onClearData,
  documentNames,
  storageEntries,
}: HostFormProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<LeftTab>("config");

  const tabs: { id: LeftTab; label: string }[] = [
    { id: "config", label: "Config" },
    { id: "storage", label: "Storage" },
    { id: "api", label: "API" },
  ];

  return (
    <div className="w-1/2 border-r border-gray-200 flex flex-col bg-gray-50 overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 border-b border-gray-200 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1 text-xs rounded font-medium cursor-pointer ${
              activeTab === tab.id
                ? "bg-white shadow-sm text-gray-900 border border-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "config" && (
        <ConfigTab
          config={config}
          onConfigChange={onConfigChange}
          onReload={onReload}
          onClearData={onClearData}
          documentNames={documentNames}
        />
      )}

      {activeTab === "storage" && (
        <div className="flex-1 overflow-hidden">
          <StorageExplorer entries={storageEntries} />
        </div>
      )}

      {activeTab === "api" && (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">
          API tools — coming soon.
        </div>
      )}
    </div>
  );
}

export default HostForm;
