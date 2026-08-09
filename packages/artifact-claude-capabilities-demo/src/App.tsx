import { useArtifactLifecycle, useStartArtifact } from "@alistigo/artifact-core";
import {
  ArtifactContextMenuContainer,
  ArtifactInfoPanel,
  alistigoLogoUrl,
  ErrorScreen,
  LoadingScreen,
  Modal,
  type PluginInfo,
} from "@alistigo/artifact-core-components-react";
import { artifactContext } from "@alistigo/claude-artifact-api";
import claudeStoragePlugin from "@alistigo/claude-storage-plugin";
import { type JSX, useState } from "react";
import pkg from "../package.json" with { type: "json" };
import { type TabId, Tabs } from "./Tabs";
import { AboutTab } from "./tabs/AboutTab";
import { AiTab } from "./tabs/AiTab";
import { ApiCallsTab } from "./tabs/ApiCallsTab";
import { ExternalNavigationTab } from "./tabs/ExternalNavigationTab";
import { FileGenerationTab } from "./tabs/FileGenerationTab";
import { InjectScriptTab } from "./tabs/InjectScriptTab";
import { PostMessageLogTab } from "./tabs/PostMessageLogTab";
import { StorageTab } from "./tabs/StorageTab";

interface AppProps {
  prefix: string;
  defaultTab?: TabId;
}

const ARTIFACT_NAME = "@alistigo/artifact-claude-capabilities-demo";

const PLUGIN_INFOS: PluginInfo[] = [
  {
    name: claudeStoragePlugin.name,
    version: claudeStoragePlugin.version ?? "?",
    type: claudeStoragePlugin.type ?? "storage",
    status: "active",
  },
];

function DraftBadge({ onClick }: { onClick: () => void }): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 items-center gap-1 rounded-b-lg border border-orange-300 bg-orange-50 px-2 text-xs font-medium text-orange-700 shadow-md hover:bg-orange-100 focus:outline-none"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-3.5 w-3.5 shrink-0"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>
      Draft
    </button>
  );
}

interface ReadyContentProps {
  isDraft: boolean;
  prefix: string;
  defaultTab: TabId;
}

// fallow-ignore-next-line complexity
function ReadyContent({ isDraft, prefix, defaultTab }: ReadyContentProps): JSX.Element {
  const [infoOpen, setInfoOpen] = useState(false);
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);

  return (
    <div className="flex h-full flex-col">
      {infoOpen && (
        <Modal title={ARTIFACT_NAME} onClose={() => setInfoOpen(false)}>
          <ArtifactInfoPanel
            artifactName={ARTIFACT_NAME}
            artifactVersion={pkg.version}
            plugins={PLUGIN_INFOS}
          />
        </Modal>
      )}
      {draftModalOpen && (
        <Modal title="Draft mode — Storage tab" onClose={() => setDraftModalOpen(false)}>
          <p className="text-sm text-gray-700">
            The Storage tab is unavailable in draft mode. The other four tabs work normally. Publish
            this artifact and open its public link to use the storage explorer.
          </p>
        </Modal>
      )}

      <ArtifactContextMenuContainer
        icon={<img src={alistigoLogoUrl} alt="" className="h-full w-full object-cover" />}
        statusBadge={isDraft ? <DraftBadge onClick={() => setDraftModalOpen(true)} /> : undefined}
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

      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {activeTab === "about" && <AboutTab />}
        {activeTab === "storage" && <StorageTab isDraft={isDraft} prefix={prefix} />}
        {activeTab === "ai" && <AiTab />}
        {activeTab === "file-generation" && <FileGenerationTab />}
        {activeTab === "api-calls" && <ApiCallsTab />}
        {activeTab === "external-navigation" && <ExternalNavigationTab />}
        {activeTab === "inject-script" && <InjectScriptTab />}
        {activeTab === "post-message-log" && <PostMessageLogTab />}
      </div>
    </div>
  );
}

// fallow-ignore-next-line complexity
export function App({ prefix, defaultTab }: AppProps): JSX.Element {
  const lifecycle = useArtifactLifecycle();
  const isDraft = !artifactContext().published;

  useStartArtifact(
    {
      onReady: async () => {
        if (isDraft) return;
        if (!claudeStoragePlugin.storage?.isAvailable()) {
          throw new Error(
            "Claude storage is not available — this artifact must run inside a Claude conversation.",
          );
        }
        const store = claudeStoragePlugin.storage.createStore();
        await store.list("");
      },
    },
    lifecycle,
  );

  const { phase, error } = lifecycle;

  if (phase === "loading") {
    return <LoadingScreen artifactName={ARTIFACT_NAME} />;
  }

  if (phase === "error") {
    return <ErrorScreen error={error ?? new Error("Unknown startup error")} />;
  }

  return <ReadyContent isDraft={isDraft} prefix={prefix} defaultTab={defaultTab ?? "about"} />;
}
